from __future__ import annotations
import textwrap
from pathlib import Path
from typing import Optional

from .utils.logging_setup import logger


def _make_text_clip(text: str, font_size: int, color: str = "white",
                    method: str = "caption", size: Optional[tuple] = None):
    from moviepy.editor import TextClip
    kwargs = dict(
        txt=text,
        fontsize=font_size,
        color=color,
        method=method,
        font="Liberation-Sans-Bold",
    )
    if size:
        kwargs["size"] = size
    try:
        return TextClip(**kwargs)
    except Exception:
        # Fallback font
        kwargs["font"] = "DejaVu-Sans-Bold"
        try:
            return TextClip(**kwargs)
        except Exception:
            kwargs.pop("font", None)
            return TextClip(**kwargs)


def render_scene_title_overlay(clip, title: str, duration: float = 3.0, position: str = "top"):
    """Fade-in/out title overlay at top or bottom of frame."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = clip.size
    tc = _make_text_clip(title, font_size=42, size=(w - 40, None))
    bg = ColorClip(size=(w, tc.h + 20), color=(0, 0, 0)).set_opacity(0.6)

    y_pos = 10 if position == "top" else h - tc.h - 30
    overlay = (
        CompositeVideoClip([bg, tc.set_position(("center", 10))])
        .set_position(("center", y_pos))
        .set_duration(min(duration, clip.duration))
        .fadein(0.5)
        .fadeout(0.5)
    )
    return CompositeVideoClip([clip, overlay])


def render_scene_description_overlay(clip, description: str,
                                      position: str = "bottom", font_size: int = 26):
    """Subtitle-style scene description at bottom of frame."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = clip.size
    wrapped = "\n".join(textwrap.wrap(description, width=70))
    tc = _make_text_clip(wrapped, font_size=font_size, size=(w - 60, None))
    bg = ColorClip(size=(w, tc.h + 16), color=(0, 0, 0)).set_opacity(0.65)

    y_pos = h - tc.h - 40
    overlay = (
        CompositeVideoClip([bg, tc.set_position(("center", 8))])
        .set_position(("center", y_pos))
        .set_duration(clip.duration)
        .fadein(0.3)
        .fadeout(0.3)
    )
    return CompositeVideoClip([clip, overlay])


def render_character_name_overlay(clip, name: str, appear_at: float = 0.5, duration: float = 2.5):
    """Show character name label briefly."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = clip.size
    tc = _make_text_clip(name, font_size=32)
    bg = ColorClip(size=(tc.w + 20, tc.h + 12), color=(30, 100, 200)).set_opacity(0.8)

    label = (
        CompositeVideoClip([bg, tc.set_position((10, 6))])
        .set_position((20, h // 2))
        .set_start(appear_at)
        .set_duration(min(duration, clip.duration - appear_at))
        .fadein(0.3)
        .fadeout(0.3)
    )
    return CompositeVideoClip([clip, label])


def render_lower_third(clip, primary_text: str, secondary_text: str = "",
                        brand_color: tuple = (52, 152, 219)):
    """Broadcast-style lower third overlay."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = clip.size
    bar = ColorClip(size=(w, 6), color=brand_color).set_position(("left", h - 90))
    primary = _make_text_clip(primary_text, font_size=36, color="white")
    bg = ColorClip(size=(w, 80), color=(10, 10, 10)).set_opacity(0.75)

    elements = [clip, bg.set_position(("left", h - 80)), bar,
                primary.set_position((20, h - 75))]
    if secondary_text:
        sec = _make_text_clip(secondary_text, font_size=22, color="#cccccc")
        elements.append(sec.set_position((20, h - 45)))

    return CompositeVideoClip(elements)


def add_progress_bar(clip, position_ratio: float, brand_color: tuple = (52, 152, 219)):
    """Thin progress bar at very bottom showing movie position (0–1)."""
    from moviepy.editor import ColorClip, CompositeVideoClip

    w, h = clip.size
    bar_width = max(1, int(w * position_ratio))
    bar = ColorClip(size=(bar_width, 4), color=brand_color).set_position(("left", h - 4))
    return CompositeVideoClip([clip, bar])
