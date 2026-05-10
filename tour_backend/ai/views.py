import os
import logging
import re
import requests

from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
MAX_ANSWER_SENTENCES = 5
MAX_ANSWER_CHARS = 700
system_prompt = """You are Kyrgyz Travel AI, a modern travel assistant for Kyrgyzstan.

Rules:
- Answer directly.
- Keep answers short: 2-5 sentences maximum.
- Use a conversational, concise, practical and modern style.
- Prioritize realistic travel recommendations.
- Avoid unnecessary explanations.
- Avoid hallucinations. Do not invent exact prices, hotel availability, schedules, visas or weather forecasts.
- If exact live data is needed, say to check the live source.
- No long introductions.
- Do not start with greetings like Hello, Hi, Привет or Здравствуйте.
- Avoid excessive politeness.
- Do not say "hope this helps".
- Never say "As an AI language model" or similar AI phrases.
- No markdown.
- No bullet points unless necessary.
- No symbols like **, ###, ---, or excessive formatting.
- Recommend places, routes, hotels, weather advice, clothing, transport and activities.
- If user asks about weather, give general seasonal guidance and recommend checking live forecast.
- Answer in the same language as the user.
- Sound like a real assistant inside a travel app, not an essay writer."""


def _parse_json_response(response):
    try:
        return response.json()
    except ValueError:
        return None


def _build_gemini_error_details(response, data, model, endpoint):
    details = {
        "status_code": response.status_code,
        "response_text": response.text,
        "model": model,
        "endpoint": endpoint,
    }

    if data is not None:
        details["response_json"] = data

    if isinstance(data, dict) and isinstance(data.get("error"), dict):
        error = data["error"]
        details["gemini_error"] = {
            "code": error.get("code"),
            "status": error.get("status"),
            "message": error.get("message"),
        }

    return details


def _extract_answer(data):
    if not isinstance(data, dict):
        return None

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return None

    first_candidate = candidates[0]
    if not isinstance(first_candidate, dict):
        return None

    content = first_candidate.get("content")
    if not isinstance(content, dict):
        return None

    parts = content.get("parts")
    if not isinstance(parts, list):
        return None

    text_parts = [
        part.get("text", "").strip()
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str)
    ]

    answer = "\n".join(part for part in text_parts if part)
    return answer or None


def _clean_answer(answer):
    answer = answer.strip()
    answer = re.sub(r"(?i)\bas an ai language model,?\s*", "", answer)
    answer = re.sub(r"(?i)\bas an ai,?\s*", "", answer)
    answer = re.sub(r"(?i)\bhope this helps[.!]?", "", answer)
    answer = re.sub(r"(?i)\bнадеюсь,?\s+это\s+поможет[.!]?", "", answer)
    answer = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", answer)
    answer = re.sub(r"(?m)^\s*[-*_]{3,}\s*$", "", answer)
    answer = re.sub(r"(#{2,}|-{3,}|\*\*|__|\*|`)", "", answer)
    answer = re.sub(r"(?m)^\s*[-*]\s+", "", answer)
    answer = _strip_openers(answer)
    answer = re.sub(r"\s*\n\s*", " ", answer)
    answer = re.sub(r"[ \t]{2,}", " ", answer)
    return _limit_answer(answer.strip())


def _strip_openers(answer):
    opener_pattern = (
        r"(?i)^\s*("
        r"hello|hi|hey|sure|absolutely|of course|certainly|ah|great question|good question|"
        r"здравствуйте|привет|добрый день|конечно|разумеется|безусловно|отличный вопрос|хороший вопрос"
        r")[,!. ]+"
    )

    while True:
        cleaned = re.sub(opener_pattern, "", answer).lstrip()
        if cleaned == answer:
            return answer
        answer = cleaned


def _limit_answer(answer):
    sentences = re.split(r"(?<=[.!?])\s+", answer)
    sentences = [sentence.strip() for sentence in sentences if sentence.strip()]

    if len(sentences) > MAX_ANSWER_SENTENCES:
        answer = " ".join(sentences[:MAX_ANSWER_SENTENCES])

    if len(answer) <= MAX_ANSWER_CHARS:
        return answer

    shortened = answer[:MAX_ANSWER_CHARS].rsplit(" ", 1)[0].rstrip(" ,;:")
    punctuation_index = max(shortened.rfind("."), shortened.rfind("!"), shortened.rfind("?"))

    if punctuation_index > 120:
        return shortened[: punctuation_index + 1].strip()

    return f"{shortened}.".strip()


@api_view(["POST"])
def ai_chat(request):
    raw_message = request.data.get("message", "")
    message = raw_message.strip() if isinstance(raw_message, str) else str(raw_message).strip()

    if not message:
        return Response({"error": "Message is required"}, status=400)

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL

    if not api_key:
        return Response({"error": "GEMINI_API_KEY is missing"}, status=500)

    url = f"{GEMINI_API_BASE_URL}/models/{model}:generateContent"

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"{system_prompt}\n\nUser: {message}"
                    }
                ]
            }
        ],
    }

    try:
        response = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            json=payload,
            timeout=30,
        )
    except requests.RequestException as exc:
        logger.exception("Gemini request failed")
        return Response(
            {
                "error": "Gemini request failed",
                "details": {
                    "message": str(exc),
                    "model": model,
                    "endpoint": url,
                },
            },
            status=502,
        )

    logger.warning(
        "Gemini response status_code=%s response.text=%s",
        response.status_code,
        response.text,
    )

    data = _parse_json_response(response)

    if response.status_code != 200:
        details = _build_gemini_error_details(response, data, model, url)
        logger.error(
            "Gemini API error status_code=%s response.text=%s details=%s",
            response.status_code,
            response.text,
            details,
        )
        return Response(
            {
                "error": "Gemini API error",
                "details": details,
            },
            status=response.status_code,
        )

    answer = _extract_answer(data)
    if not answer:
        logger.error("Invalid Gemini response status_code=%s response.text=%s", response.status_code, response.text)
        return Response(
            {
                "error": "Invalid Gemini response",
                "details": {
                    "status_code": response.status_code,
                    "response_text": response.text,
                    "response_json": data,
                    "model": model,
                    "endpoint": url,
                },
            },
            status=502,
        )

    return Response({"answer": _clean_answer(answer)})
