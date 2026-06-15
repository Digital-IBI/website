from __future__ import annotations
import hashlib
import json
import time
from pathlib import Path
from typing import Optional


class DiskCache:
    def __init__(self, cache_dir: str | Path = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def get(self, key: str) -> Optional[str]:
        p = self._path(key)
        if not p.exists():
            return None
        try:
            data = json.loads(p.read_text())
            if data.get("expires_at", float("inf")) < time.time():
                p.unlink(missing_ok=True)
                return None
            return data["value"]
        except Exception:
            return None

    def set(self, key: str, value: str, ttl_hours: int = 720) -> None:
        data = {"value": value, "expires_at": time.time() + ttl_hours * 3600}
        self._path(key).write_text(json.dumps(data))

    def make_key(self, *args: str) -> str:
        combined = "|".join(str(a) for a in args)
        return hashlib.sha256(combined.encode()).hexdigest()
