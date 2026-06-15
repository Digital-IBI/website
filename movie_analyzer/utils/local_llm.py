from __future__ import annotations
import json
import re
from typing import Optional
from ..utils.logging_setup import logger


class LocalLLM:
    """
    Tries backends in order: ollama → transformers (Phi-3-mini).
    Falls back gracefully with clear error messages.
    """

    def __init__(self, backend: str = "auto", ollama_model: str = "llama3.2:3b",
                 ollama_host: str = "http://localhost:11434",
                 transformers_model: str = "microsoft/Phi-3-mini-4k-instruct"):
        self.ollama_model = ollama_model
        self.ollama_host = ollama_host
        self.transformers_model = transformers_model
        self._pipe = None
        self._ollama_client = None

        if backend == "auto":
            self._backend = self._detect_backend()
        else:
            self._backend = backend
            self._init_backend(backend)

        logger.info(f"LocalLLM using backend: {self._backend}")

    def _detect_backend(self) -> str:
        if self._try_init_ollama():
            return "ollama"
        if self._try_init_transformers():
            return "transformers"
        raise RuntimeError(
            "No local LLM backend available. Either:\n"
            "  1. Install and start ollama: https://ollama.ai  then  ollama pull llama3.2:3b\n"
            "  2. The transformers Phi-3 model will be downloaded automatically (~7GB).\n"
            "  3. Use --cloud-ai flag to use Claude API instead."
        )

    def _init_backend(self, backend: str) -> None:
        if backend == "ollama":
            if not self._try_init_ollama():
                raise RuntimeError(f"Ollama backend requested but not available at {self.ollama_host}")
        elif backend == "transformers":
            if not self._try_init_transformers():
                raise RuntimeError("Transformers backend failed to load")

    def _try_init_ollama(self) -> bool:
        try:
            import ollama
            client = ollama.Client(host=self.ollama_host)
            client.list()
            self._ollama_client = client
            return True
        except Exception:
            return False

    def _try_init_transformers(self) -> bool:
        try:
            import torch
            from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM

            logger.info(f"Loading {self.transformers_model} via transformers...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            tokenizer = AutoTokenizer.from_pretrained(self.transformers_model, trust_remote_code=True)
            model = AutoModelForCausalLM.from_pretrained(
                self.transformers_model,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                device_map="auto",
                trust_remote_code=True,
            )
            self._pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device_map="auto",
            )
            return True
        except Exception as e:
            logger.debug(f"Transformers init failed: {e}")
            return False

    def generate(self, system: str, user: str, max_tokens: int = 512) -> str:
        if self._backend == "ollama":
            return self._ollama_generate(system, user, max_tokens)
        return self._transformers_generate(system, user, max_tokens)

    def _ollama_generate(self, system: str, user: str, max_tokens: int) -> str:
        import ollama
        response = self._ollama_client.chat(
            model=self.ollama_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            options={"num_predict": max_tokens},
        )
        return response["message"]["content"].strip()

    def _transformers_generate(self, system: str, user: str, max_tokens: int) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        result = self._pipe(
            messages,
            max_new_tokens=max_tokens,
            do_sample=False,
            return_full_text=False,
        )
        return result[0]["generated_text"].strip()

    def generate_json(self, system: str, user: str, schema_hint: str = "") -> dict | list:
        full_system = system + (
            f"\n\nYou MUST return only valid JSON matching this schema:\n{schema_hint}\n"
            "Return nothing else — no explanation, no markdown, just the JSON."
            if schema_hint else "\n\nReturn only valid JSON, no explanation or markdown."
        )
        raw = self.generate(full_system, user, max_tokens=1024)
        raw = raw.strip()
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract first JSON object/array from text
            match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", raw)
            if match:
                return json.loads(match.group(1))
            logger.warning(f"LLM returned non-JSON: {raw[:200]}")
            return {}
