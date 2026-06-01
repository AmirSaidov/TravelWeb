from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class HuggingFaceServiceError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, details: dict[str, Any] | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


def _messages_to_prompt(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for item in messages:
        role = str(item.get("role") or "user").strip().lower()
        content = str(item.get("content") or "").strip()
        if not content:
            continue
        if role == "system":
            lines.append(f"System:\n{content}")
        elif role == "assistant":
            lines.append(f"Assistant:\n{content}")
        else:
            lines.append(f"User:\n{content}")

    lines.append("Assistant:")
    return "\n\n".join(lines).strip()


def _parse_json_response(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return None


def _loading_message(data: Any) -> str | None:
    if not isinstance(data, dict):
        return None

    error = str(data.get("error") or "").strip()
    estimated_time = data.get("estimated_time")
    if not error:
        return None

    lowered = error.lower()
    if "loading" not in lowered and "currently loading" not in lowered and "warming" not in lowered:
        return None

    if isinstance(estimated_time, (int, float)):
        return f"Модель Hugging Face еще прогревается, попробуйте через {round(estimated_time)} сек."
    return "Модель Hugging Face еще прогревается, попробуйте чуть позже."


def _extract_text(data: Any, prompt: str) -> str | None:
    text: str | None = None

    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            text = first.get("generated_text") or first.get("text")
        elif isinstance(first, str):
            text = first
    elif isinstance(data, dict):
        text = data.get("generated_text") or data.get("output_text") or data.get("answer") or data.get("text")
        choices = data.get("choices")
        if not text and isinstance(choices, list) and choices:
            first_choice = choices[0]
            if isinstance(first_choice, dict):
                message = first_choice.get("message")
                if isinstance(message, dict):
                    text = message.get("content")
                text = text or first_choice.get("text")

    if not isinstance(text, str):
        return None

    cleaned = text.strip()
    if prompt and cleaned.startswith(prompt):
        cleaned = cleaned[len(prompt):].strip()
    if cleaned.lower().startswith("assistant:"):
        cleaned = cleaned.split(":", 1)[1].strip()
    return cleaned or None


def _is_chat_completions_endpoint(api_url: str) -> bool:
    return "/chat/completions" in str(api_url or "")


def _messages_for_chat(messages: list[dict[str, Any]]) -> list[dict[str, str]]:
    chat_messages: list[dict[str, str]] = []
    for item in messages:
        role = str(item.get("role") or "user").strip().lower()
        content = str(item.get("content") or "").strip()
        if not content:
            continue
        if role not in {"system", "user", "assistant"}:
            role = "user"
        chat_messages.append({"role": role, "content": content})
    return chat_messages


def _build_payload(api_url: str, model_id: str, messages: list[dict[str, Any]], prompt: str, max_tokens: int) -> dict[str, Any]:
    safe_max_tokens = max(1, int(max_tokens or 700))
    if _is_chat_completions_endpoint(api_url):
        chat_messages = _messages_for_chat(messages)
        if not chat_messages:
            chat_messages = [{"role": "user", "content": prompt}]
        return {
            "model": model_id,
            "messages": chat_messages,
            "max_tokens": safe_max_tokens,
            "temperature": 0.45,
            "top_p": 0.9,
        }

    return {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": safe_max_tokens,
            "temperature": 0.45,
            "top_p": 0.9,
            "return_full_text": False,
        },
        "options": {
            "wait_for_model": True,
        },
    }


def _unsupported_model_message(data: Any, response_text: str = "") -> str | None:
    raw_message = ""
    if isinstance(data, dict):
        error = data.get("error")
        if isinstance(error, dict):
            raw_message = str(error.get("message") or error.get("code") or "")
        else:
            raw_message = str(error or data.get("message") or "")
    raw_message = raw_message or str(response_text or "")
    lowered = raw_message.lower()
    if "not supported" in lowered or "model_not_supported" in lowered or "not a chat model" in lowered:
        return raw_message or "Model is not supported by the selected Hugging Face provider."
    return None


def generate_hf_answer(messages, context=None, max_tokens=700) -> str:
    api_key = str(getattr(settings, "HF_API_KEY", "") or "").strip()
    api_url = str(getattr(settings, "HF_API_URL", "") or "").strip()
    model_id = str(getattr(settings, "HF_MODEL_ID", "openai/gpt-oss-120b") or "openai/gpt-oss-120b").strip()

    if not api_key:
        raise HuggingFaceServiceError("HF_API_KEY is missing", status_code=401)
    if not api_url:
        raise HuggingFaceServiceError("HF_API_URL is missing", status_code=500)

    safe_messages = messages if isinstance(messages, list) else []
    prompt = _messages_to_prompt(safe_messages)
    if not prompt:
        raise HuggingFaceServiceError("Prompt is empty", status_code=400)

    payload = _build_payload(api_url, model_id, safe_messages, prompt, max_tokens)

    logger.info("Hugging Face request started provider=huggingface model=%s", model_id)
    try:
        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=40,
        )
    except requests.Timeout as exc:
        logger.exception("Hugging Face timeout provider=huggingface model=%s", model_id)
        raise HuggingFaceServiceError(
            "Hugging Face не ответил вовремя.",
            status_code=504,
            details={"provider": "huggingface", "model": model_id},
        ) from exc
    except requests.RequestException as exc:
        logger.exception("Hugging Face request failed provider=huggingface model=%s", model_id)
        raise HuggingFaceServiceError(
            "Не удалось обратиться к Hugging Face.",
            status_code=502,
            details={"provider": "huggingface", "model": model_id, "error": str(exc)},
        ) from exc

    data = _parse_json_response(response)
    loading_message = _loading_message(data)
    if loading_message:
        logger.warning("Hugging Face loading provider=huggingface model=%s response=%s", model_id, data)
        raise HuggingFaceServiceError(
            loading_message,
            status_code=503,
            details={"provider": "huggingface", "model": model_id, "response": data},
        )

    unsupported_message = _unsupported_model_message(data, response.text)
    if unsupported_message:
        logger.error(
            "Hugging Face unsupported model provider=huggingface status=%s model=%s endpoint=%s response=%s",
            response.status_code,
            model_id,
            api_url,
            response.text,
        )
        raise HuggingFaceServiceError(
            f"Hugging Face model is unsupported by the selected provider: {unsupported_message}",
            status_code=response.status_code,
            details={"provider": "huggingface", "model": model_id, "endpoint": api_url, "response": data or response.text},
        )

    if response.status_code in {401, 403}:
        logger.error("Hugging Face auth error provider=huggingface status=%s response=%s", response.status_code, response.text)
        raise HuggingFaceServiceError(
            "Hugging Face token is invalid or has no access.",
            status_code=response.status_code,
            details={"provider": "huggingface", "model": model_id, "response": data or response.text},
        )
    if response.status_code == 429:
        logger.warning("Hugging Face rate limit provider=huggingface response=%s", response.text)
        raise HuggingFaceServiceError(
            "Hugging Face rate limit exceeded.",
            status_code=429,
            details={"provider": "huggingface", "model": model_id, "response": data or response.text},
        )
    if response.status_code == 503:
        logger.warning("Hugging Face unavailable provider=huggingface response=%s", response.text)
        raise HuggingFaceServiceError(
            "Hugging Face model is temporarily unavailable.",
            status_code=503,
            details={"provider": "huggingface", "model": model_id, "response": data or response.text},
        )
    if response.status_code != 200:
        logger.error(
            "Hugging Face API error provider=huggingface status=%s model=%s endpoint=%s response=%s",
            response.status_code,
            model_id,
            api_url,
            response.text,
        )
        raise HuggingFaceServiceError(
            "Hugging Face API error.",
            status_code=response.status_code,
            details={"provider": "huggingface", "model": model_id, "endpoint": api_url, "response": data or response.text},
        )

    answer = _extract_text(data, prompt)
    if not answer:
        logger.error("Invalid Hugging Face response provider=huggingface response=%s", data or response.text)
        raise HuggingFaceServiceError(
            "Hugging Face returned an empty answer.",
            status_code=502,
            details={"provider": "huggingface", "model": model_id, "response": data or response.text},
        )

    logger.info("Hugging Face request finished provider=huggingface model=%s", model_id)
    return answer
