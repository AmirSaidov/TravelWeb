from __future__ import annotations

import json

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from ai.huggingface_service import _build_payload, _messages_to_prompt


DEFAULT_CANDIDATE_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen3-32B",
    "google/gemma-3-27b-it",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503",
    "openai/gpt-oss-120b",
]


class Command(BaseCommand):
    help = "Test Hugging Face inference/chat endpoint and print model, endpoint, status code, response body."

    def add_arguments(self, parser):
        parser.add_argument(
            "--model",
            action="append",
            dest="models",
            help="Model ID to test. Can be passed multiple times. Defaults to HF_MODEL_ID.",
        )
        parser.add_argument(
            "--candidates",
            action="store_true",
            help="Test a known candidate list instead of only HF_MODEL_ID.",
        )
        parser.add_argument(
            "--endpoint",
            default=None,
            help="Endpoint to test. Defaults to HF_API_URL.",
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=60,
            help="Request timeout in seconds.",
        )

    def handle(self, *args, **options):
        token = str(getattr(settings, "HF_API_KEY", "") or "").strip()
        endpoint = str(options.get("endpoint") or getattr(settings, "HF_API_URL", "") or "").strip()

        if not token:
            self.stderr.write(self.style.ERROR("HF_API_KEY is missing."))
            return
        if not endpoint:
            self.stderr.write(self.style.ERROR("HF_API_URL is missing."))
            return

        if options.get("candidates"):
            models = DEFAULT_CANDIDATE_MODELS
        else:
            models = options.get("models") or [str(getattr(settings, "HF_MODEL_ID", "") or "").strip()]
        models = [model for model in models if model]

        if not models:
            self.stderr.write(self.style.ERROR("No model provided."))
            return

        messages = [
            {"role": "system", "content": "You are a short test assistant."},
            {"role": "user", "content": "Reply with one short English sentence: HF test ok."},
        ]
        prompt = _messages_to_prompt(messages)

        for model in models:
            payload = _build_payload(endpoint, model, messages, prompt, max_tokens=60)
            self.stdout.write("")
            self.stdout.write(f"model: {model}")
            self.stdout.write(f"endpoint: {endpoint}")

            try:
                response = requests.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=int(options.get("timeout") or 60),
                )
            except requests.RequestException as exc:
                self.stdout.write("status_code: REQUEST_ERROR")
                self.stdout.write(f"response_body: {exc}")
                continue

            self.stdout.write(f"status_code: {response.status_code}")
            body = response.text
            try:
                parsed = response.json()
                body = json.dumps(parsed, ensure_ascii=False)
            except ValueError:
                pass
            self.stdout.write(f"response_body: {body[:4000]}")
