from __future__ import annotations
from pathlib import Path

from .config import Config
from .data_models import Scene
from .utils.cache import DiskCache
from .utils.logging_setup import logger


def load_blip2_model(config: Config):
    """Load BLIP-2 processor and model. Downloads on first run (~10GB)."""
    try:
        import torch
        from transformers import Blip2Processor, Blip2ForConditionalGeneration
    except ImportError:
        raise ImportError("Install transformers + accelerate: pip install transformers accelerate")

    import torch
    from transformers import Blip2Processor, Blip2ForConditionalGeneration

    logger.info(f"Loading BLIP-2 model: {config.BLIP2_MODEL}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    processor = Blip2Processor.from_pretrained(config.BLIP2_MODEL)
    model = Blip2ForConditionalGeneration.from_pretrained(
        config.BLIP2_MODEL,
        torch_dtype=dtype,
        device_map="auto" if device == "cuda" else None,
    )
    if device == "cpu":
        model = model.to(device)
    model.eval()
    logger.info("BLIP-2 model loaded")
    return processor, model


def caption_scene(
    keyframe_paths: list[str],
    processor,
    model,
) -> str:
    """Generate a caption for a scene using its keyframes."""
    import torch
    from PIL import Image

    if not keyframe_paths:
        return "Scene with no extractable frames."

    device = next(model.parameters()).device
    prompt = "Question: Describe what is happening in this movie scene. Answer:"
    best_caption = ""

    for frame_path in keyframe_paths[:3]:
        if not Path(frame_path).exists():
            continue
        try:
            image = Image.open(frame_path).convert("RGB")
            inputs = processor(images=image, text=prompt, return_tensors="pt").to(device)
            with torch.no_grad():
                output = model.generate(
                    **inputs, max_new_tokens=80, num_beams=4, early_stopping=True
                )
            caption = processor.decode(output[0], skip_special_tokens=True)
            # Strip the prompt from the output if echoed back
            caption = caption.replace(prompt, "").strip()
            if len(caption) > len(best_caption):
                best_caption = caption
        except Exception as e:
            logger.debug(f"BLIP-2 failed on {frame_path}: {e}")
            continue

    return best_caption or "Scene content could not be captioned."


def caption_all_scenes(scenes: list[Scene], config: Config) -> list[Scene]:
    """Caption all scenes using BLIP-2. Results are disk-cached."""
    cache = DiskCache(config.CACHE_DIR)
    uncached = [s for s in scenes if s.caption is None]

    if not uncached:
        return scenes

    processor, model = load_blip2_model(config)
    logger.info(f"Captioning {len(uncached)} scenes with BLIP-2...")

    from tqdm import tqdm
    for scene in tqdm(uncached, desc="Captioning scenes"):
        cache_key = cache.make_key("blip2", *scene.keyframe_paths)
        cached = cache.get(cache_key)
        if cached:
            scene.caption = cached
            continue
        scene.caption = caption_scene(scene.keyframe_paths, processor, model)
        cache.set(cache_key, scene.caption)

    # Free GPU memory
    import torch
    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return scenes
