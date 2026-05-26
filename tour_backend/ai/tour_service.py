from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

from django.db.models import Q, QuerySet

from tours.models import Tour


TOUR_RECOMMENDATION_KEYWORDS = [
    "посоветуй тур",
    "порекомендуй тур",
    "какие туры есть",
    "какие есть туры",
    "хочу поехать",
    "куда поехать",
    "тур на",
    "туры",
    "тур до",
    "тур по",
    "recommend tour",
    "suggest tour",
]


DESTINATION_ALIASES = {
    "bishkek": ["bishkek", "бишкек", "бишкеке"],
    "osh": ["osh", "ош", "оше"],
    "issyk-kul": ["issyk kul", "issyk-kul", "иссык куль", "иссык-куль", "иссык куле", "ысык кол", "ысык көл"],
    "karakol": ["karakol", "каракол", "караколе"],
    "son-kul": ["son kul", "son-kul", "song kul", "сон куль", "сон-куль", "сон куле", "сонкуль"],
    "naryn": ["naryn", "нарын", "нарыне"],
    "ala-archa": ["ala archa", "ala-archa", "ала арча", "ала-арча", "ала арче"],
    "cholpon-ata": ["cholpon ata", "cholpon-ata", "чолпон ата", "чолпон-ата", "чолпон ате"],
    "jalal-abad": ["jalal abad", "jalal-abad", "джалал абад", "джалал-абад", "джалал абаде"],
    "talas": ["talas", "талас", "таласе"],
    "batken": ["batken", "баткен", "баткене"],
}


DESTINATION_DISPLAY = {
    "bishkek": "Бишкек",
    "osh": "Ош",
    "issyk-kul": "Иссык-Куль",
    "karakol": "Каракол",
    "son-kul": "Сон-Куль",
    "naryn": "Нарын",
    "ala-archa": "Ала-Арча",
    "cholpon-ata": "Чолпон-Ата",
    "jalal-abad": "Джалал-Абад",
    "talas": "Талас",
    "batken": "Баткен",
}


ACTIVITY_ALIASES = {
    "nature": ["nature", "природа", "природу", "ущель", "лес", "водопад", "eco", "эко"],
    "mountains": ["mountains", "mountain", "горы", "горн", "трек", "trekking", "hiking", "поход"],
    "lake": ["lake", "озеро", "озера", "иссык", "сон куль", "сон-куль", "коль", "куль"],
    "culture": ["culture", "cultural", "культура", "культур", "история", "традиц"],
    "family": ["family", "семья", "семей", "дет", "kids"],
}


DIFFICULTY_ALIASES = {
    "easy": ["easy", "легкий", "легкая", "легко", "лёгкий", "лёгкая"],
    "moderate": ["moderate", "medium", "средний", "обычный", "умеренный"],
    "challenging": ["challenging", "hard", "сложный", "трудный", "активный"],
}


def _normalize_text(value: str) -> str:
    normalized = value.lower().replace("ё", "е").replace("-", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def _slugify(value: str) -> str:
    slug = re.sub(r"[^\w]+", "-", _normalize_text(value), flags=re.UNICODE).strip("-")
    return slug or "tour"


def is_tour_recommendation_request(message: str) -> bool:
    text = _normalize_text(message)
    return any(keyword in text for keyword in TOUR_RECOMMENDATION_KEYWORDS)


def resolve_tour_destination(message: str) -> str | None:
    text = f" {_normalize_text(message)} "
    matches: list[tuple[int, str]] = []

    for canonical, aliases in DESTINATION_ALIASES.items():
        for alias in aliases:
            normalized_alias = _normalize_text(alias)
            pattern = rf"(?<!\w){re.escape(normalized_alias)}(?!\w)"
            if re.search(pattern, text):
                matches.append((len(normalized_alias), canonical))

    if not matches:
        return None

    return sorted(matches, reverse=True)[0][1]


def parse_tour_max_price(message: str) -> int | None:
    text = _normalize_text(message)
    patterns = [
        r"(?:до|не дороже|максимум|max|under|below)\s*(\d[\d\s]{2,})\s*(?:сом|kgs|kгс|kgс)?",
        r"(\d[\d\s]{2,})\s*(?:сом|kgs|kгс|kgс)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            raw = re.sub(r"\s+", "", match.group(1))
            try:
                return int(raw)
            except ValueError:
                return None
    return None


def parse_tour_duration_days(message: str) -> int | None:
    text = _normalize_text(message)
    match = re.search(r"(?:на)?\s*(\d{1,2})\s*(?:день|дня|дней|day|days)", text)
    if not match:
        return None
    return max(1, min(30, int(match.group(1))))


def parse_tour_people_count(message: str) -> int | None:
    text = _normalize_text(message)
    words = {"двоих": 2, "троих": 3, "четверых": 4, "пятерых": 5}
    for word, count in words.items():
        if word in text:
            return count

    match = re.search(r"(?:на|для)?\s*(\d{1,2})\s*(?:человек|человека|персон|people|persons)", text)
    if not match:
        return None
    return max(1, min(50, int(match.group(1))))


def parse_tour_difficulty(message: str) -> str | None:
    text = _normalize_text(message)
    for difficulty, aliases in DIFFICULTY_ALIASES.items():
        if any(alias in text for alias in aliases):
            return difficulty
    return None


def parse_tour_activity_type(message: str) -> str | None:
    text = _normalize_text(message)
    for activity, aliases in ACTIVITY_ALIASES.items():
        if any(alias in text for alias in aliases):
            return activity
    return None


def parse_tour_travel_style(message: str) -> str | None:
    text = _normalize_text(message)
    if any(word in text for word in ["budget", "econom", "эконом", "дешево", "дешевле", "недорог"]):
        return "budget"
    if any(word in text for word in ["comfort", "комфорт", "дорого", "удобно"]):
        return "comfort"
    if any(word in text for word in ["standard", "средний", "обычный"]):
        return "standard"
    return None


def parse_tour_filters(message: str) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    destination = resolve_tour_destination(message)
    max_price = parse_tour_max_price(message)
    duration_days = parse_tour_duration_days(message)
    difficulty = parse_tour_difficulty(message)
    people_count = parse_tour_people_count(message)
    travel_style = parse_tour_travel_style(message)
    activity_type = parse_tour_activity_type(message)

    if destination:
        filters["destination"] = destination
    if max_price:
        filters["max_price"] = max_price
    if duration_days:
        filters["duration_days"] = duration_days
    if difficulty:
        filters["difficulty"] = difficulty
    if people_count:
        filters["people_count"] = people_count
    if travel_style:
        filters["travel_style"] = travel_style
    if activity_type:
        filters["activity_type"] = activity_type

    return filters


def _apply_destination_filter(queryset: QuerySet[Tour], destination: str) -> QuerySet[Tour]:
    display = DESTINATION_DISPLAY.get(destination, destination)
    aliases = DESTINATION_ALIASES.get(destination, [destination, display])
    query = Q()
    for value in {destination, display, *aliases}:
        query |= Q(location__icontains=value) | Q(title__icontains=value) | Q(description__icontains=value)
    return queryset.filter(query)


def _tour_matches_activity(tour: Tour, activity_type: str) -> bool:
    aliases = [_normalize_text(item) for item in ACTIVITY_ALIASES.get(activity_type, [activity_type])]
    text = _normalize_text(f"{tour.title} {tour.description} {tour.location}")
    types = getattr(tour, "types", None)
    if not isinstance(types, list):
        types = []
    type_text = _normalize_text(" ".join(str(item) for item in types))
    return any(alias in text or alias in type_text for alias in aliases)


def _tour_url(tour: Tour) -> str:
    return f"/tour/{tour.id}-{_slugify(tour.title)}"


def _format_price(value: Decimal | float | int) -> int | float:
    amount = float(value)
    return int(amount) if amount.is_integer() else round(amount, 2)


def _tour_to_dict(tour: Tour) -> dict[str, Any]:
    currency = (getattr(tour, "currency", "") or "KGS").upper()
    types = getattr(tour, "types", None)
    if not isinstance(types, list):
        types = []

    return {
        "id": tour.id,
        "title": tour.title,
        "destination": tour.location,
        "duration_days": tour.duration,
        "price": _format_price(tour.price),
        "currency": currency,
        "description": (tour.description or "")[:700],
        "difficulty": tour.difficulty,
        "included": "",
        "max_people": tour.max_people,
        "activity_types": types,
        "url": _tour_url(tour),
    }


def get_available_tours(filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    filters = filters or {}
    queryset = Tour.objects.all().order_by("price", "duration", "id")

    destination = filters.get("destination")
    if destination:
        queryset = _apply_destination_filter(queryset, str(destination))

    max_price = filters.get("max_price")
    if max_price:
        queryset = queryset.filter(price__lte=max_price)

    duration_days = filters.get("duration_days")
    if duration_days:
        queryset = queryset.filter(duration__lte=duration_days)

    difficulty = filters.get("difficulty")
    if difficulty:
        queryset = queryset.filter(difficulty__iexact=str(difficulty))

    people_count = filters.get("people_count")
    if people_count:
        queryset = queryset.filter(max_people__gte=people_count)

    travel_style = filters.get("travel_style")
    if travel_style == "budget":
        queryset = queryset.order_by("price", "duration", "id")
    elif travel_style == "comfort":
        queryset = queryset.order_by("-price", "-duration", "id")

    tours = list(queryset[:40])
    activity_type = filters.get("activity_type")
    if activity_type:
        tours = [tour for tour in tours if _tour_matches_activity(tour, str(activity_type))]

    return [_tour_to_dict(tour) for tour in tours[:8]]
