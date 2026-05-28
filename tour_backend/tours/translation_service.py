import logging

from deep_translator import GoogleTranslator
from django.conf import settings


logger = logging.getLogger(__name__)

SOURCE_LANGUAGE = "ru"
TARGET_LANGUAGES = ("en", "ky")


def auto_translate_text(text: str, target_language: str) -> str:
    source_text = str(text or "").strip()
    if not source_text:
        return ""

    if target_language == SOURCE_LANGUAGE:
        return source_text

    if not getattr(settings, "AUTO_TRANSLATE_CONTENT", True):
        return source_text

    try:
        translated = GoogleTranslator(source=SOURCE_LANGUAGE, target=target_language).translate(source_text)
    except Exception:  # noqa: BLE001 - external translator should never break model saves.
        logger.exception("Dynamic content translation failed target_language=%s", target_language)
        return source_text

    return str(translated or "").strip() or source_text
