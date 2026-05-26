from __future__ import annotations

import re
from typing import Any


BUDGET_PRESETS = {
    "budget": {
        "food_per_day": 600,
        "transport_per_day": 300,
        "activities_per_day": 500,
        "hotel_per_night": 1200,
    },
    "standard": {
        "food_per_day": 1200,
        "transport_per_day": 700,
        "activities_per_day": 1000,
        "hotel_per_night": 2500,
    },
    "comfort": {
        "food_per_day": 2500,
        "transport_per_day": 1500,
        "activities_per_day": 2500,
        "hotel_per_night": 5000,
    },
}


DESTINATION_MULTIPLIERS = {
    "bishkek": 1.0,
    "бишкек": 1.0,
    "osh": 0.9,
    "ош": 0.9,
    "issyk-kul": 1.2,
    "иссык-куль": 1.2,
    "karakol": 1.15,
    "каракол": 1.15,
    "son-kul": 1.4,
    "сон-куль": 1.4,
    "naryn": 1.1,
    "нарын": 1.1,
    "ala-archa": 0.8,
    "ала-арча": 0.8,
}


BUDGET_KEYWORDS = [
    "сколько денег",
    "сколько брать",
    "бюджет",
    "расход",
    "стоимость поездки",
    "сколько нужно",
    "во сколько обойдется",
    "во сколько обойдётся",
    "примерно стоит",
    "цена поездки",
    "деньги",
    "сом",
    "price",
    "budget",
    "cost",
]


DESTINATION_DISPLAY = {
    "bishkek": "Бишкек",
    "osh": "Ош",
    "issyk-kul": "Иссык-Куль",
    "karakol": "Каракол",
    "son-kul": "Сон-Куль",
    "naryn": "Нарын",
    "ala-archa": "Ала-Арча",
}


DESTINATION_ALIASES = {
    "bishkek": ["bishkek", "бишкек", "бишкеке"],
    "osh": ["osh", "ош", "оше"],
    "issyk-kul": ["issyk kul", "issyk-kul", "иссык куль", "иссык-куль", "иссык куле", "ысык кол", "ысык көл"],
    "karakol": ["karakol", "каракол", "караколе"],
    "son-kul": ["son kul", "son-kul", "song kul", "сон куль", "сон-куль", "сон куле", "сонкуль"],
    "naryn": ["naryn", "нарын", "нарыне"],
    "ala-archa": ["ala archa", "ala-archa", "ала арча", "ала-арча", "ала арче"],
}


def _normalize_text(value: str) -> str:
    normalized = value.lower().replace("ё", "е").replace("-", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def _round_100(value: float) -> int:
    return int(round(value / 100) * 100)


def is_budget_request(message: str) -> bool:
    text = _normalize_text(message)
    return any(keyword in text for keyword in BUDGET_KEYWORDS)


def resolve_budget_destination(message: str) -> str | None:
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


def parse_budget_days(message: str) -> int:
    text = _normalize_text(message)
    day_match = re.search(r"(?:на|за)?\s*(\d{1,2})\s*(?:день|дня|дней|day|days)", text)
    if day_match:
        return max(1, min(30, int(day_match.group(1))))

    night_match = re.search(r"(\d{1,2})\s*(?:ночь|ночи|ночей|night|nights)", text)
    if night_match:
        return max(1, min(30, int(night_match.group(1)) + 1))

    return 1


def has_days_in_message(message: str) -> bool:
    text = _normalize_text(message)
    return bool(re.search(r"\d{1,2}\s*(?:день|дня|дней|day|days|ночь|ночи|ночей|night|nights)", text))


def parse_budget_people(message: str) -> int:
    text = _normalize_text(message)

    word_people = {
        "одного": 1,
        "одну": 1,
        "двоих": 2,
        "троих": 3,
        "четверых": 4,
        "пятерых": 5,
    }
    for word, value in word_people.items():
        if word in text:
            return value

    patterns = [
        r"(?:на|для)\s*(\d{1,2})\s*(?:человек|человека|персон|турист|туриста|people|persons)",
        r"family of\s*(\d{1,2})",
        r"(\d{1,2})\s*(?:человек|человека|персон|турист|туриста|people|persons)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return max(1, min(20, int(match.group(1))))

    return 1


def parse_budget_style(message: str) -> str:
    text = _normalize_text(message)
    if any(word in text for word in ["budget", "econom", "эконом", "дешево", "дешево", "дешевле", "минимум"]):
        return "budget"
    if any(word in text for word in ["comfort", "комфорт", "дорого", "удобно", "хороший отель"]):
        return "comfort"
    return "standard"


def estimate_trip_budget(destination: str, days: int = 1, people: int = 1, style: str = "standard") -> dict[str, Any]:
    canonical = destination if destination in DESTINATION_DISPLAY else resolve_budget_destination(destination)
    if not canonical:
        raise ValueError("Unknown destination")

    safe_days = max(1, int(days or 1))
    safe_people = max(1, int(people or 1))
    safe_style = style if style in BUDGET_PRESETS else "standard"

    preset = BUDGET_PRESETS[safe_style]
    nights = max(safe_days - 1, 0)

    food_total = preset["food_per_day"] * safe_days * safe_people
    transport_total = preset["transport_per_day"] * safe_days * safe_people
    hotel_total = preset["hotel_per_night"] * nights * safe_people
    activities_total = preset["activities_per_day"] * safe_days * safe_people
    subtotal = food_total + transport_total + hotel_total + activities_total

    multiplier = DESTINATION_MULTIPLIERS.get(canonical, DESTINATION_MULTIPLIERS.get(_normalize_text(DESTINATION_DISPLAY[canonical]), 1.0))
    total_min = _round_100(subtotal * multiplier * 0.85)
    total_max = _round_100(subtotal * multiplier * 1.25)

    recommendation = (
        "Это примерная оценка без авиабилетов и дорогих частных трансферов. "
        "Лучше взять запас 15–20% на такси, кафе и непредвиденные расходы."
    )

    return {
        "destination": DESTINATION_DISPLAY[canonical],
        "days": safe_days,
        "people": safe_people,
        "style": safe_style,
        "food_total": _round_100(food_total * multiplier),
        "transport_total": _round_100(transport_total * multiplier),
        "hotel_total": _round_100(hotel_total * multiplier),
        "activities_total": _round_100(activities_total * multiplier),
        "total_min": total_min,
        "total_max": total_max,
        "currency": "KGS",
        "recommendation": recommendation,
    }
