from __future__ import annotations
import json
import re
import time
from collections import deque
from typing import Optional
from ..utils.logging_setup import logger


class CloudLLM:
    """Optional Anthropic Claude wrapper. Only used when --cloud-ai flag is set."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6",
                 requests_per_min: int = 50):
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required for --cloud-ai mode")
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=api_key)
        except ImportError:
            raise ImportError("Install the anthropic package: pip install anthropic")
        self.model = model
        self._rpm = requests_per_min
        self._request_times: deque[float] = deque()

    def _rate_limit(self) -> None:
        now = time.time()
        self._request_times = deque(t for t in self._request_times if now - t < 60)
        if len(self._request_times) >= self._rpm:
            sleep_for = 60 - (now - self._request_times[0]) + 0.1
            if sleep_for > 0:
                time.sleep(sleep_for)
        self._request_times.append(time.time())

    def generate(self, system: str, user: str, max_tokens: int = 4096) -> str:
        self._rate_limit()
        from tenacity import retry, stop_after_attempt, wait_exponential
        import anthropic

        @retry(stop=stop_after_attempt(4), wait=wait_exponential(min=2, max=30),
               reraise=True)
        def _call():
            msg = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return msg.content[0].text

        return _call()

    def generate_json(self, system: str, user: str, schema_hint: str = "") -> dict | list:
        full_system = system + (
            f"\n\nReturn only valid JSON matching:\n{schema_hint}\nNo explanation, just JSON."
            if schema_hint else "\n\nReturn only valid JSON."
        )
        raw = self.generate(full_system, user)
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", raw)
            if match:
                return json.loads(match.group(1))
            logger.warning(f"Claude returned non-JSON: {raw[:200]}")
            return {}

    def generate_with_images(self, system: str, user_text: str,
                              image_paths: list[str], max_tokens: int = 1024) -> str:
        import base64
        import anthropic

        content = []
        for path in image_paths[:5]:
            with open(path, "rb") as f:
                img_data = base64.standard_b64encode(f.read()).decode("utf-8")
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": img_data},
            })
        content.append({"type": "text", "text": user_text})

        self._rate_limit()
        msg = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": content}],
        )
        return msg.content[0].text
