from __future__ import annotations

import re
from typing import Any

from .tour_service import DESTINATION_ALIASES, parse_tour_filters, resolve_tour_destination


TRAVEL_ADVICE_INTENT = "travel_advice"

TOUR_KEYWORDS = [
    "тур",
    "туры",
    "турлар",
    "тур сунушта",
    "кандай турлар бар",
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
    "recommend a tour",
    "recommend tour",
    "show me tours",
    "what tours are available",
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
    "а кроме этого",
    "кроме этого",
    "что еще",
    "что ещё",
    "другой вариант",
    "еще тур",
    "ещё тур",
    "more",
    "another",
]

TRAVEL_ADVICE_KEYWORDS = [
    "что посоветуешь",
    "что порекомендуешь",
    "куда поехать",
    "куда съездить",
    "хочу на природу",
    "хочу на природе",
    "хочу в горы",
    "люблю озера",
    "люблю көл",
    "хочу спокойный отдых",
    "спокойный отдых",
    "хочу экстрим",
    "экстрим",
    "еду с детьми",
    "с детьми",
    "для детей",
    "романтическое место",
    "романтика",
    "возле бишкека",
    "рядом с бишкеком",
    "near bishkek",
    "around bishkek",
    "nature near bishkek",
    "want nature",
    "want mountains",
    "i like lakes",
    "calm trip",
    "quiet trip",
    "extreme",
    "with kids",
    "family trip",
    "romantic place",
    "эмне сунуштайсың",
    "кайда барса болот",
    "табиятка баргым келет",
    "тоого баргым келет",
    "көлдөрдү жакшы көрөм",
    "балдар менен",
    "тынч эс алуу",
    "романтикалык жер",
]

WEATHER_KEYWORDS = [
    "погода",
    "температура",
    "дождь",
    "снег",
    "ветер",
    "прогноз",
    "аба ырайы",
    "аба ырайы кандай",
    "жамгыр",
    "кар жаайт",
    "кар тушот",
    "кар түшөт",
    "шамал",
    "градус",
    "градусы",
    "жарко",
    "холодно",
    "тепло",
    "forecast",
    "weather",
    "what's the weather",
    "what is the weather",
    "current weather",
    "temperature",
    "rain",
    "snow",
    "wind",
]

WEATHER_COMPARE_KEYWORDS = [
    "где теплее",
    "самый теплый",
    "самая теплая",
    "самое теплое",
    "самые теплые",
    "самый холодный",
    "самая холодная",
    "самое холодное",
    "самые холодные",
    "где холоднее",
    "где лучше климат",
    "сравни погоду",
    "где жарче",
    "теплый климат",
    "теплее всего",
    "жарче всего",
    "эң жылуу",
    "эн жылуу",
    "эң суук",
    "эн суук",
    "кайсы жерде жылуу",
    "аба ырайын салыштыр",
    "аба ырайын салыштыргыла",
    "климат",
    "coldest",
    "warmest",
    "hottest",
    "warmer",
    "climate",
    "where is warmer",
    "compare weather",
    "best climate",
]

PACKING_KEYWORDS = [
    "что взять",
    "что мне взять",
    "что надеть",
    "что мне надеть",
    "как одеться",
    "что одеть",
    "что мне одеть",
    "что мне одеть вечером",
    "что вечером надеть",
    "что надеть вечером",
    "а вечером",
    "вечером",
    "а ночью",
    "ночью",
    "если вечером",
    "а если вечером",
    "а зимой",
    "а летом",
    "а детям",
    "одежда",
    "вещи",
    "куртка",
    "обувь",
    "pack",
    "packing",
    "what to pack",
    "what to take",
    "what should i take",
    "wear",
    "what should i wear",
    "clothes",
    "jacket",
    "shoes",
]

CONTEXT_FOLLOWUP_KEYWORDS = [
    "вечером",
    "а вечером",
    "что вечером надеть",
    "что мне одеть вечером",
    "что надеть вечером",
    "а если вечером",
    "если вечером",
    "ночью",
    "а ночью",
    "а детям",
    "детям",
    "а зимой",
    "зимой",
    "а летом",
    "летом",
    "а какой лучше",
    "какой лучше",
    "а что посоветуешь",
    "что посоветуешь",
    "а кроме этого",
    "кроме этого",
    "besides that",
    "what about evening",
    "what about kids",
    "what is better",
    "what do you recommend",
]

TRAVEL_FOLLOWUP_KEYWORDS = [
    "а есть что то спокойнее",
    "есть что то спокойнее",
    "что то спокойнее",
    "спокойнее",
    "что то легче",
    "что-то легче",
    "легче",
    "полегче",
    "что то активнее",
    "что-то активнее",
    "активнее",
    "что то подешевле",
    "что-то подешевле",
    "подешевле",
    "дешевле",
    "дороже",
    "ближе",
    "поближе",
    "другое",
    "другой",
    "другие",
    "еще варианты",
    "ещё варианты",
    "а кроме этого",
    "кроме этого",
    "calmer",
    "quieter",
    "easier",
    "more active",
    "cheaper",
    "more expensive",
    "closer",
    "different",
    "other options",
]

BUDGET_KEYWORDS = [
    "бюджет",
    "сколько денег",
    "сколько брать",
    "стоимость",
    "расходы",
    "цена",
    "сколько стоит",
    "канча акча",
    "канча акча алышым керек",
    "акча",
    "чыгым",
    "баа",
    "how much money should i take",
    "how much money",
    "money",
    "expenses",
    "price",
    "cost",
    "budget",
]

KYRGYZ_LANGUAGE_MARKERS = [
    "ң",
    "ө",
    "ү",
    "кыргызстанда",
    "кайсы",
    "жерде",
    "жылуу",
    "суук",
    "аба ырай",
    "кандай",
    "турлар",
    "сунушта",
    "канча",
    "акча",
    "алышым",
    "керек",
    "жалал",
]

ENGLISH_LANGUAGE_MARKERS = [
    "where",
    "what",
    "which",
    "warmest",
    "hottest",
    "coldest",
    "weather",
    "climate",
    "tour",
    "tours",
    "recommend",
    "available",
    "money",
    "budget",
]


def _normalize_text(value: str) -> str:
    normalized = str(value or "").lower()
    normalized = normalized.replace("ё", "е").replace("ө", "о").replace("ү", "у")
    normalized = normalized.replace("-", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def detect_language(message: Any) -> str:
    raw_text = str(message or "").lower()
    normalized = _normalize_text(raw_text)
    has_latin = bool(re.search(r"[a-z]", raw_text))
    has_cyrillic = bool(re.search(r"[а-яёңөү]", raw_text))

    if any(marker in raw_text for marker in KYRGYZ_LANGUAGE_MARKERS):
        return "ky"
    if any(marker in normalized for marker in ENGLISH_LANGUAGE_MARKERS) or (has_latin and not has_cyrillic):
        return "en"
    return "ru"


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
        if any(isinstance(card, dict) and card.get("type") == "weather" for card in cards):
            return "weather"
        if any(isinstance(card, dict) and card.get("type") == "weather_compare" for card in cards):
            return "weather_compare"

        text = _normalize_text(_message_content(item))
        if not text:
            continue
        if _has_any(text, TRAVEL_ADVICE_KEYWORDS):
            return TRAVEL_ADVICE_INTENT
        if _has_any(text, TOUR_KEYWORDS):
            return "tour_search"
        if _has_any(text, BUDGET_KEYWORDS):
            return "budget"
        if _has_any(text, PACKING_KEYWORDS):
            return "packing"
        if _has_any(text, WEATHER_COMPARE_KEYWORDS):
            return "weather_compare"
        if _has_any(text, WEATHER_KEYWORDS):
            return "weather"

    return None


def _previous_destination(recent_messages=None) -> str | None:
    for item in reversed(_recent_items(recent_messages)):
        for card in _message_cards(item):
            if not isinstance(card, dict):
                continue
            destination = card.get("destination") or card.get("location")
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


def _previous_travel_context(recent_messages=None) -> dict[str, Any]:
    for item in reversed(_recent_items(recent_messages)):
        role = _message_value(item, "role")
        if role and role != "user":
            continue

        content = _message_content(item)
        text = _normalize_text(content)
        if not text:
            continue

        filters = parse_tour_filters(content)
        destination = resolve_tour_destination(content)
        nearby_destination = any(word in text for word in ["возле", "рядом", "около", "near", "around", "жакын"])
        activity_type = filters.get("activity_type")
        if destination or nearby_destination or activity_type:
            return {
                "destination": destination,
                "activity_type": activity_type,
                "nearby_destination": nearby_destination,
            }

    return {}


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


def _travel_advice_filters(
    message: str,
    destination: str | None,
    previous_destination: str | None,
    previous_activity_type: str | None = None,
) -> dict[str, Any]:
    filters = parse_tour_filters(message)
    text = _normalize_text(message)
    is_travel_followup = _has_any(text, TRAVEL_FOLLOWUP_KEYWORDS) or _has_any(text, CONTEXT_FOLLOWUP_KEYWORDS)

    if not filters.get("destination") and destination:
        filters["destination"] = destination
    if not filters.get("destination") and previous_destination and is_travel_followup:
        filters["destination"] = previous_destination

    if any(word in text for word in ["возле", "рядом", "около", "near", "around", "жакын"]):
        filters["nearby_destination"] = True

    if any(word in text for word in ["по городу", "городск", "city", "urban"]):
        filters["activity_type"] = "city"
        filters["strict_semantic"] = True
    if any(word in text for word in ["природ", "табият", "nature"]):
        filters["activity_type"] = "nature"
    if any(word in text for word in ["гор", "тоого", "тоо", "mountain", "mountains"]):
        filters["activity_type"] = "mountains"
    if any(word in text for word in ["озер", "көл", "кол", "lake", "lakes"]):
        filters["activity_type"] = "lake"
    if any(word in text for word in ["дет", "балдар", "kids", "family"]):
        filters["activity_type"] = "family"
        filters.setdefault("difficulty", "easy")
    if any(word in text for word in ["спокой", "тынч", "calm", "quiet", "relax"]):
        filters["calm"] = True
        current_activity = filters.get("activity_type")
        filters["activity_type"] = previous_activity_type if current_activity == "calm" and previous_activity_type else current_activity or previous_activity_type or "calm"
        filters.setdefault("difficulty", "easy")
    if any(word in text for word in ["легче", "полегче", "easier"]):
        filters.setdefault("difficulty", "easy")
    if any(word in text for word in ["активнее", "active", "adventure"]):
        filters["activity_type"] = "mountains"
        filters["difficulty"] = "moderate"
    if any(word in text for word in ["подешевле", "дешевле", "cheaper"]):
        filters["travel_style"] = "budget"
    if any(word in text for word in ["дороже", "more expensive"]):
        filters["travel_style"] = "comfort"
    if any(word in text for word in ["ближе", "поближе", "closer"]):
        filters["nearby_destination"] = True
    if any(word in text for word in ["экстрим", "extreme", "adventure", "адреналин"]):
        filters["activity_type"] = "extreme"
        filters["difficulty"] = "hard"
        filters["strict_semantic"] = True
    if any(word in text for word in ["тяжел", "тяжёл", "сложн", "трудн", "hard", "difficult", "challenging"]):
        filters["difficulty"] = "hard"
        filters["strict_semantic"] = True
    if any(word in text for word in ["романтик", "romantic"]):
        filters["activity_type"] = "romantic"

    filters.setdefault("limit", 3)
    return filters


def resolve_intent(message, recent_messages=None, context=None):
    text = _normalize_text(message)
    language = detect_language(message)
    destination = resolve_tour_destination(message)
    previous_intent = _previous_intent(recent_messages)
    previous_destination = _previous_destination(recent_messages)
    previous_travel_context = _previous_travel_context(recent_messages)
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
    explicit_travel_advice = _has_any(text, TRAVEL_ADVICE_KEYWORDS)
    context_followup = _has_any(text, CONTEXT_FOLLOWUP_KEYWORDS)
    travel_followup = _has_any(text, TRAVEL_FOLLOWUP_KEYWORDS)
    explicit_weather_compare = _has_any(text, WEATHER_COMPARE_KEYWORDS)
    explicit_weather = _has_any(text, WEATHER_KEYWORDS)

    if explicit_weather_compare:
        return {
            "intent": "weather_compare",
            "language": language,
            "destination": destination,
            "filters": {},
            "confidence": 0.97,
            "reason": "weather comparison keyword has highest priority",
            "priority_match": "weather_compare_keyword",
        }

    if explicit_weather:
        return {
            "intent": "weather",
            "language": language,
            "destination": destination,
            "filters": {},
            "confidence": 0.96,
            "reason": "weather keyword has priority over tour search",
            "priority_match": "weather_keyword",
        }

    if explicit_budget:
        if not destination and previous_destination:
            destination = previous_destination
        return {
            "intent": "budget",
            "language": language,
            "destination": destination,
            "filters": {},
            "confidence": 0.9,
            "reason": "explicit budget keyword",
        }

    if explicit_packing:
        if not destination and previous_destination:
            destination = previous_destination
        return {
            "intent": "packing",
            "language": language,
            "destination": destination,
            "filters": {"inherited_context": bool(previous_destination and not resolve_tour_destination(message))},
            "confidence": 0.9 if previous_destination else 0.88,
            "reason": "packing request with recent context" if previous_destination else "explicit packing/clothing keyword",
            "priority_match": "packing_keyword",
        }

    if context_followup and previous_intent in {"weather", "packing", "weather_compare"}:
        destination = destination or previous_destination
        return {
            "intent": "packing",
            "language": language,
            "destination": destination,
            "filters": {"inherited_context": True},
            "confidence": 0.84,
            "reason": "packing-style follow-up inherits weather context",
            "priority_match": "context_followup",
        }

    if explicit_travel_advice or ((context_followup or (travel_followup and not tour_followup)) and previous_intent in {TRAVEL_ADVICE_INTENT, "tour_search"}):
        travel_destination = (
            destination
            or previous_travel_context.get("destination")
            or previous_destination
        )
        filters = _travel_advice_filters(
            message,
            destination,
            travel_destination,
            previous_activity_type=previous_travel_context.get("activity_type"),
        )
        if previous_travel_context.get("nearby_destination") and travel_followup:
            filters["nearby_destination"] = True
        destination = filters.get("destination") or destination or travel_destination
        if destination:
            filters["destination"] = destination
        exclude_ids = _previous_tour_ids(recent_messages)
        if exclude_ids and (context_followup or travel_followup):
            filters["exclude_ids"] = exclude_ids
        return {
            "intent": TRAVEL_ADVICE_INTENT,
            "language": language,
            "destination": destination,
            "filters": filters,
            "confidence": 0.9,
            "reason": "travel advisor request analyzed before database lookup",
            "priority_match": "travel_advice_keyword" if explicit_travel_advice else "context_followup",
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
            "language": language,
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
            "language": language,
            "destination": destination,
            "filters": filters,
            "confidence": 0.95,
            "reason": "explicit tour keyword",
            "priority_match": "tour_keyword",
        }

    if _location_only(message, destination) and previous_intent in {"tour_search", TRAVEL_ADVICE_INTENT, "weather", "budget", "packing"}:
        filters = {}
        if previous_intent in {"tour_search", TRAVEL_ADVICE_INTENT}:
            filters["destination"] = destination
            filters["strict_destination"] = True
        return {
            "intent": previous_intent,
            "language": language,
            "destination": destination,
            "filters": filters,
            "confidence": 0.82,
            "reason": "short location-only follow-up inherits recent intent",
        }

    return {
        "intent": "general",
        "language": language,
        "destination": destination,
        "filters": {},
        "confidence": 0.5,
        "reason": "no explicit domain intent",
    }
