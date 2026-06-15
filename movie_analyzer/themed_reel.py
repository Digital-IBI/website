"""
Themed reel scoring and selection.

Scores scenes for a theme query using four signals:
  - Semantic similarity (sentence-transformers): scene text vs theme descriptor
  - Emotion match: scene emotion distribution vs theme target emotions
  - Audio energy match: high/low/any preference per theme
  - Dialogue keyword match

Supports optional character filters:
  - mode="any"  → scene must feature AT LEAST ONE of the listed characters
  - mode="all"  → scene must feature ALL listed characters (relationship scenes)
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

from .data_models import Character, Scene
from .utils.logging_setup import logger

# ── Built-in theme library ────────────────────────────────────────────────────

BUILTIN_THEMES: dict[str, dict] = {
    "funny": {
        "descriptor": "funny comedy laughing humor joke silly awkward clumsy embarrassing",
        "target_emotions": ["joy", "surprise"],
        "energy": "low",
        "keywords": ["laugh", "joke", "funny", "silly", "hilarious", "humor", "comedy",
                     "ridiculous", "embarrassing", "awkward", "absurd"],
    },
    "badass": {
        "descriptor": "badass action fight cool powerful dominant intimidating strong fearless weapon showdown",
        "target_emotions": ["anger", "neutral"],
        "energy": "high",
        "keywords": ["fight", "punch", "weapon", "badass", "kill", "destroy", "power", "gun",
                     "sword", "strength", "dominate", "threaten", "confront", "baddie"],
    },
    "romantic": {
        "descriptor": "romantic love tender intimate close together couple hug kiss affection passion",
        "target_emotions": ["joy"],
        "energy": "low",
        "keywords": ["love", "kiss", "together", "heart", "beautiful", "romantic", "date",
                     "darling", "sweetheart", "gorgeous", "adore", "affection", "tender"],
    },
    "sexy": {
        "descriptor": "attractive seductive sensual flirting desire chemistry seduction alluring",
        "target_emotions": ["joy", "surprise"],
        "energy": "medium",
        "keywords": ["sexy", "attractive", "desire", "flirt", "seduce", "alluring",
                     "gorgeous", "tempting", "irresistible"],
    },
    "scary": {
        "descriptor": "scary frightening horror dark terror threat danger creepy ominous dread",
        "target_emotions": ["fear", "disgust"],
        "energy": "any",
        "keywords": ["scared", "fear", "horror", "dark", "terror", "danger", "monster",
                     "threat", "creepy", "haunting", "nightmare", "sinister", "dread"],
    },
    "sad": {
        "descriptor": "sad emotional crying grief loss heartbreak tears mourning despair",
        "target_emotions": ["sadness"],
        "energy": "low",
        "keywords": ["cry", "loss", "death", "goodbye", "tears", "sad", "grief",
                     "heartbreak", "mourn", "miss", "regret", "tragedy", "despair"],
    },
    "action": {
        "descriptor": "action intense chase explosion running fast dramatic speeding bullets crash",
        "target_emotions": ["anger", "fear", "surprise"],
        "energy": "high",
        "keywords": ["run", "chase", "explosion", "crash", "fast", "escape", "attack",
                     "sprint", "ambush", "bullet", "bomb", "vehicle", "intense"],
    },
    "dramatic": {
        "descriptor": "dramatic intense confrontation revelation shocking twist betrayal secret uncovered",
        "target_emotions": ["anger", "sadness", "fear", "surprise"],
        "energy": "any",
        "keywords": ["confront", "reveal", "shock", "truth", "secret", "betrayal",
                     "twist", "discover", "expose", "dramatic", "tension", "turning"],
    },
    "tense": {
        "descriptor": "tense suspense nervous waiting uncertain dread building anxiety",
        "target_emotions": ["fear", "neutral"],
        "energy": "medium",
        "keywords": ["wait", "suspense", "nervous", "quiet", "watch", "stalk",
                     "careful", "silent", "hidden", "danger", "trap", "uncertain"],
    },
    "triumphant": {
        "descriptor": "victory triumph success winning achievement celebration proud overcoming",
        "target_emotions": ["joy", "surprise"],
        "energy": "high",
        "keywords": ["win", "victory", "triumph", "success", "celebrate", "proud",
                     "overcome", "achieve", "champion", "hero", "beat", "conquer"],
    },
}


@dataclass
class ThemeQuery:
    """A single themed compilation request."""
    theme: str                          # key in BUILTIN_THEMES or "custom"
    character_ids: list[str] = field(default_factory=list)
    character_filter_mode: str = "any"  # "any" | "all"
    custom_descriptor: str = ""         # used when theme == "custom"
    min_score: float = 0.25
    max_scenes: int = 25
    target_duration: float = 90.0       # seconds
    label: str = ""                     # display label e.g. "John's Badass Moments"

    def display_label(self) -> str:
        if self.label:
            return self.label
        theme_display = self.theme.replace("_", " ").title()
        return f"{theme_display} Moments"


# ── Scorer ────────────────────────────────────────────────────────────────────

class ThemeScorer:
    """
    Scores scenes against a theme. Loads sentence-transformer model once
    and reuses it across multiple ThemeQuery calls.
    """

    _MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self) -> None:
        self._model = None
        self._cache: dict[str, list[float]] = {}

    def _load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformer for themed scoring...")
            self._model = SentenceTransformer(self._MODEL_NAME)
        return self._model

    def _embed(self, text: str) -> list[float]:
        if text in self._cache:
            return self._cache[text]
        model = self._load()
        vec = model.encode(text, convert_to_numpy=True).tolist()
        self._cache[text] = vec
        return vec

    @staticmethod
    def _cosine(a: list[float], b: list[float]) -> float:
        import math
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        if na == 0 or nb == 0:
            return 0.0
        return max(0.0, dot / (na * nb))

    def score(self, scene: Scene, query: ThemeQuery) -> float:
        """Return composite theme match score 0–1 for a scene."""
        theme_def = BUILTIN_THEMES.get(query.theme, {})

        descriptor = query.custom_descriptor or theme_def.get("descriptor", query.theme)
        target_emotions: list[str] = theme_def.get("target_emotions", [])
        energy_pref: str = theme_def.get("energy", "any")
        keywords: list[str] = theme_def.get("keywords", [])

        # ── 1. Semantic score (40%) ──
        scene_text = _scene_text(scene)
        if scene_text.strip():
            sem = self._cosine(self._embed(descriptor), self._embed(scene_text))
        else:
            sem = 0.0

        # ── 2. Emotion score (30%) ──
        emo = _emotion_score(scene, target_emotions)

        # ── 3. Audio energy match (20%) ──
        nrg = _energy_score(scene, energy_pref)

        # ── 4. Keyword score (10%) ──
        kw = _keyword_score(scene, keywords)

        return 0.40 * sem + 0.30 * emo + 0.20 * nrg + 0.10 * kw


def _scene_text(scene: Scene) -> str:
    parts = []
    if scene.caption:
        parts.append(scene.caption)
    dialogue_words = " ".join(dl.text for dl in scene.dialogue[:8])
    if dialogue_words:
        parts.append(dialogue_words[:300])
    if scene.dominant_emotion:
        parts.append(f"mood: {scene.dominant_emotion}")
    return " ".join(parts)


def _emotion_score(scene: Scene, target_emotions: list[str]) -> float:
    if not target_emotions:
        return 0.5
    # Aggregate emotion scores across dialogue lines
    totals: dict[str, float] = {}
    count = 0
    for dl in scene.dialogue:
        if dl.emotions:
            for e, v in dl.emotions.items():
                totals[e] = totals.get(e, 0.0) + v
            count += 1
    if count:
        avg = {e: v / count for e, v in totals.items()}
    elif scene.dominant_emotion:
        avg = {scene.dominant_emotion: 1.0}
    else:
        return 0.3  # neutral if no emotion data

    return min(1.0, sum(avg.get(e, 0.0) for e in target_emotions))


def _energy_score(scene: Scene, energy_pref: str) -> float:
    if energy_pref == "any" or scene.audio_energy is None:
        return 0.5
    e = scene.audio_energy  # 0–1
    if energy_pref == "high":
        return e
    if energy_pref == "low":
        return 1.0 - e
    # medium — bell curve peaked at 0.5
    return 1.0 - abs(e - 0.5) * 2


def _keyword_score(scene: Scene, keywords: list[str]) -> float:
    if not keywords:
        return 0.5
    all_text = " ".join(dl.text.lower() for dl in scene.dialogue)
    if scene.caption:
        all_text += " " + scene.caption.lower()
    hits = sum(1 for kw in keywords if kw in all_text)
    return min(1.0, hits / max(1, min(3, len(keywords) // 3)))


# ── Character filter ──────────────────────────────────────────────────────────

def _passes_character_filter(scene: Scene, query: ThemeQuery) -> bool:
    if not query.character_ids:
        return True
    scene_chars = set(scene.character_ids)
    if query.character_filter_mode == "all":
        return all(cid in scene_chars for cid in query.character_ids)
    return any(cid in scene_chars for cid in query.character_ids)


# ── Public API ────────────────────────────────────────────────────────────────

def find_themed_scenes(
    scenes: list[Scene],
    characters: list[Character],
    query: ThemeQuery,
    scorer: Optional[ThemeScorer] = None,
) -> list[tuple[Scene, float]]:
    """
    Return (scene, score) pairs matching the theme query, sorted by timeline order.
    Scenes below min_score or failing character filter are excluded.
    Budget is trimmed to target_duration by greedily taking highest-scored scenes.
    """
    if scorer is None:
        scorer = ThemeScorer()

    # Validate theme
    if query.theme not in BUILTIN_THEMES and not query.custom_descriptor:
        logger.warning(
            f"Unknown theme '{query.theme}' and no custom_descriptor — "
            f"available: {list(BUILTIN_THEMES)}"
        )

    logger.info(
        f"Scoring {len(scenes)} scenes for theme '{query.theme}'"
        + (f" (character filter: {query.character_ids})" if query.character_ids else "")
    )

    candidates: list[tuple[Scene, float]] = []
    for scene in scenes:
        if not _passes_character_filter(scene, query):
            continue
        score = scorer.score(scene, query)
        if score >= query.min_score:
            candidates.append((scene, score))

    logger.info(f"  {len(candidates)} scenes pass threshold {query.min_score:.2f}")

    if not candidates:
        return []

    # Budget: pick highest-scored scenes that fit within target_duration
    # Sort by score descending first to pick best scenes
    by_score = sorted(candidates, key=lambda x: x[1], reverse=True)
    selected: list[tuple[Scene, float]] = []
    total_dur = 0.0
    for scene, score in by_score:
        if len(selected) >= query.max_scenes:
            break
        if total_dur + scene.duration > query.target_duration * 1.3:
            # Allow 30% overshoot; then stop
            if total_dur > 0:
                break
        selected.append((scene, score))
        total_dur += scene.duration

    # Re-sort selected scenes by timeline order for narrative continuity
    selected.sort(key=lambda x: x[0].start_time)

    logger.info(
        f"  Selected {len(selected)} scenes "
        f"({total_dur:.0f}s / {query.target_duration:.0f}s target)"
    )
    return selected
