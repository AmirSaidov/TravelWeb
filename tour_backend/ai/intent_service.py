from __future__ import annotations

import re
from typing import Any

from .tour_service import DESTINATION_ALIASES, parse_tour_filters, resolve_tour_destination


TOUR_KEYWORDS = [
    "тур",
    "туры",
    "поездка",
    "вариант",
    "варианты",
    "маршрут",
    "экскурсия",
    "другой тур",
    "какие есть",
    "покажи",
    "выбрать",
    "подбери",
    "посоветуй",
    "recommend",
    "available tours",
    "tour",
    "tours",
    "route",
]

TOUR_MORE_KEYWORDS = [
    "другой тур",
    "другие туры",
    "еще варианты",
    "ещё варианты",
    "дай еще",
    "дай ещё",
    "покажи другие",
    "другой вариант",
    "еще тур",
    "ещё тур",
    "more",
    "another",
]

WEATHER_KEYWORDS = [
    "погода",
    "температура",
    "дождь",
    "снег",
    "ветер",
    "прогноз",
    "градус",
    "градусы",
    "жарко",
    "холодно",
    "тепло",
    "forecast",
    "weather",
    "temperature",
    "rain",
    "snow",
    "wind",
]

PACKING_KEYWORDS = [
    "что взять",
    "что надеть",
    "как одеться",
    "одежда",
    "вещи",
    "куртка",
    "обувь",
    "pack",
    "packing",
    "wear",
    "clothes",
    "jacket",
    "shoes",
]

BUDGET_KEYWORDS = [
    "бюджет",
    "сколько денег",
    "сколько брать",
    "стоимость",
    "расходы",
    "цена",
    "price",
    "cost",
    "budget",
]


def _normalize_text(value: str) -> str:
    normalized = str(value or "").lower()
    normalized = normalized.replace("ё", "е").replace("ө", "о").replace("ү", "у")
    normalized = normalized.replace("-", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def _has_any(text: str, keywords: list[str]) -> bool:
    return any(_normalize_text(keyword) in text for keyword in keywords)


def _message_value(message: Any, key: str, default=None):
    if isinstance(message, dict):
        return message.get(key, default)
    return getattr(message, key, default)


def _message_content(message: Any) -> str:
    return str(_message_value(message, "content", "") or _message_value(message, "text", "") or "")


def _message_cards(message: Any) -> list[dict[str, Any]]:
    cards = _message_value(message, "cards", []) or []
    return cards if isinstance(cards, list) else []


def _recent_items(recent_messages=None) -> list[Any]:
    if not recent_messages:
        return []
    return list(recent_messages)[-8:]


def _previous_intent(recent_messages=None) -> str | None:
    for item in reversed(_recent_items(recent_messages)[-5:]):
        cards = _message_cards(item)
        if any(isinstance(card, dict) and card.get("type") == "tour" for card in cards):
            return "tour_search"

        text = _normalize_text(_message_content(item))
        if not text:
            continue
        if _has_any(text, TOUR_KEYWORDS):
            return "tour_search"
        if _has_any(text, BUDGET_KEYWORDS):
            return "budget"
        if _has_any(text, PACKING_KEYWORDS):
            return "packing"
        if _has_any(text, WEATHER_KEYWORDS):
            return "weather"

    return None


def _previous_destination(recent_messages=None) -> str | None:
    for item in reversed(_recent_items(recent_messages)):
        for card in _message_cards(item):
            if not isinstance(card, dict):
                continue
            destination = card.get("destination")
            if destination:
                resolved = resolve_tour_destination(str(destination))
                if resolved:
                    return resolved

        resolved = resolve_tour_destination(_message_content(item))
        if resolved:
            return resolved

    return None


def _previous_tour_ids(recent_messages=None) -> list[int]:
    ids: list[int] = []
    for item in _recent_items(recent_messages):
        for card in _message_cards(item):
            if not isinstance(card, dict) or card.get("type") != "tour":
                continue
            try:
                tour_id = int(card.get("id"))
            except (TypeError, ValueError):
                continue
            if tour_id not in ids:
                ids.append(tour_id)
    return ids


def _location_only(message: str, destination: str | None) -> bool:
    if not destination:
        return False

    text = f" {_normalize_text(message)} "
    aliases = DESTINATION_ALIASES.get(destination, [destination])
    for alias in sorted(aliases, key=len, reverse=True):
        normalized_alias = _normalize_text(alias)
        text = re.sub(rf"(?<!\w){re.escape(normalized_alias)}(?!\w)", " ", text)

    text = re.sub(r"\b(а|так|ну|нет|да|и|в|во|на|по|про|а в|а на|then|and|in|for)\b", " ", text)
    text = re.sub(r"[?!.:,;]+", " ", text)
    return not _normalize_text(text)


def _requested_limit(message: str) -> int | None:
    text = _normalize_text(message)
    if any(word in text for word in ["все", "all"]):
        return 8

    match = re.search(r"\b(\d{1,2})\s*(?:вариант|варианта|вариантов|тур|тура|туров|options|tours)?\b", text)
    if not match:
        return None

    return max(1, min(8, int(match.group(1))))


def resolve_intent(message, recent_messages=None, context=None):
    text = _normalize_text(message)
    destination = resolve_tour_destination(message)
    previous_intent = _previous_intent(recent_messages)
    previous_destination = _previous_destination(recent_messages)
    requested_limit = _requested_limit(message)
    limit_followup = (
        previous_intent == "tour_search"
        and requested_limit is not None
        and _has_any(text, ["вариант", "варианты", "тур", "туры", "option", "options", "tour", "tours"])
    )
    tour_followup = _has_any(text, TOUR_MORE_KEYWORDS) or limit_followup
    explicit_tour = _has_any(text, TOUR_KEYWORDS)
    explicit_budget = _has_any(text, BUDGET_KEYWORDS)
    explicit_packing = _has_any(text, PACKING_KEYWORDS)
    explicit_weather = _has_any(text, WEATHER_KEYWORDS)

    if explicit_weather:
        return {
            "intent": "weather",
            "destination": destination,
            "filters": {},
            "confidence": 0.96,
            "reason": "weather keyword has priority over tour search",
            "priority_match": "weather_keyword",
        }

    if tour_followup and previous_intent == "tour_search":
        filters = parse_tour_filters(message)
        if requested_limit:
            filters["limit"] = requested_limit
        if destination:
            filters["destination"] = destination
            filters["strict_destination"] = True
        if not destination and previous_destination:
            destination = previous_destination
            filters["destination"] = previous_destination
            filters["strict_destination"] = True
        exclude_ids = _previous_tour_ids(recent_messages)
        if exclude_ids:
            filters["exclude_ids"] = exclude_ids
        return {
            "intent": "tour_search",
            "destination": destination,
            "filters": filters,
            "confidence": 0.92,
            "reason": "tour follow-up inherits previous tour context",
            "priority_match": "tour_followup",
        }

    if explicit_tour:
        filters = parse_tour_filters(message)
        if requested_limit:
            filters["limit"] = requested_limit
        if destination:
            filters["destination"] = destination
            filters["strict_destination"] = True
        return {
            "intent": "tour_search",
            "destination": destination,
            "filters": filters,
            "confidence": 0.95,
            "reason": "explicit tour keyword",
            "priority_match": "tour_keyword",
        }

    if explicit_budget:
        return {
            "intent": "budget",
            "destination": destination,
            "filters": {},
            "confidence": 0.9,
            "reason": "explicit budget keyword",
        }

    if explicit_packing:
        return {
            "intent": "packing",
            "destination": destination,
            "filters": {},
            "confidence": 0.88,
            "reason": "explicit packing/clothing keyword",
        }

    if _location_only(message, destination) and previous_intent in {"tour_search", "weather", "budget", "packing"}:
        filters = {}
        if previous_intent == "tour_search":
            filters["destination"] = destination
            filters["strict_destination"] = True
        return {
            "intent": previous_intent,
            "destination": destination,
            "filters": filters,
            "confidence": 0.82,
            "reason": "short location-only follow-up inherits recent intent",
        }

    return {
        "intent": "general",
        "destination": destination,
        "filters": {},
        "confidence": 0.5,
        "reason": "no explicit domain intent",
    }
