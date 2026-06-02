from __future__ import annotations

import re
from decimal import Decimal
from typing import Any
from urllib.parse import urljoin

from django.conf import settings
from django.db.models import Q, QuerySet

from tours.models import Stay


STAY_KEYWORDS = [
    "где остановиться",
    "остановиться",
    "жилье",
    "жильё",
    "отель",
    "отели",
    "гостиница",
    "гостиницы",
    "проживание",
    "ночевка",
    "ночёвка",
    "юрта",
    "юрты",
    "guesthouse",
    "stay",
    "stays",
    "hotel",
    "accommodation",
    "lodging",
]

STAY_WITH_TOUR_KEYWORDS = [
    "тур с проживанием",
    "тур + отель",
    "тур и отель",
    "где жить во время тура",
    "отели рядом с туром",
    "поездка на 2 дня с жильем",
    "поездка на 2 дня с жильём",
    "с жильем",
    "с жильём",
    "с проживанием",
]

DESTINATION_ALIASES = {
    "bishkek": ["bishkek", "бишкек", "бишкеке", "бишкека"],
    "osh": ["osh", "ош", "оше", "ошская", "ошской"],
    "issyk-kul": ["issyk kul", "issyk-kul", "иссык куль", "иссык-куль", "иссык куле", "ысык кол", "ысык көл"],
    "karakol": ["karakol", "каракол", "караколе"],
    "son-kul": ["son kul", "son-kul", "сон куль", "сон-куль", "сон куле"],
    "naryn": ["naryn", "нарын", "нарыне"],
    "ala-archa": ["ala archa", "ala-archa", "ала арча", "ала-арча", "ала арче"],
    "jalal-abad": ["jalal abad", "jalal-abad", "джалал абад", "джалал-абад"],
    "talas": ["talas", "талас"],
    "batken": ["batken", "баткен"],
}

DESTINATION_DISPLAY = {
    "bishkek": "Бишкек",
    "osh": "Ош",
    "issyk-kul": "Иссык-Куль",
    "karakol": "Каракол",
    "son-kul": "Сон-Куль",
    "naryn": "Нарын",
    "ala-archa": "Ала-Арча",
    "jalal-abad": "Джалал-Абад",
    "talas": "Талас",
    "batken": "Баткен",
}

STAY_TYPE_ALIASES = {
    "hotel": ["hotel", "отель", "отели", "гостиница", "гостиницы"],
    "yurt": ["yurt", "юрта", "юрты", "юрточный", "yurt camp"],
    "guesthouse": ["guesthouse", "guest house", "гестхаус", "гостевой дом", "guest"],
    "camp": ["camp", "лагерь", "кемп", "кемпинг"],
}


def _normalize_text(value: Any) -> str:
    text = str(value or "").lower().replace("ё", "е").replace("-", " ")
    return re.sub(r"\s+", " ", text).strip()


def is_stay_request(message: str) -> bool:
    text = _normalize_text(message)
    return any(keyword in text for keyword in STAY_KEYWORDS)


def is_tour_with_stay_request(message: str) -> bool:
    text = _normalize_text(message)
    return any(keyword in text for keyword in STAY_WITH_TOUR_KEYWORDS)


def resolve_stay_destination(message: str) -> str | None:
    text = f" {_normalize_text(message)} "
    matches: list[tuple[int, str]] = []
    for canonical, aliases in DESTINATION_ALIASES.items():
        for alias in aliases:
            alias_text = _normalize_text(alias)
            if re.search(rf"(?<!\w){re.escape(alias_text)}(?!\w)", text):
                matches.append((len(alias_text), canonical))
    if not matches:
        return None
    return sorted(matches, reverse=True)[0][1]


def parse_stay_type(message: str) -> str | None:
    text = _normalize_text(message)
    for stay_type, aliases in STAY_TYPE_ALIASES.items():
        if any(_normalize_text(alias) in text for alias in aliases):
            return stay_type
    return None


def parse_stay_max_price(message: str) -> int | None:
    text = _normalize_text(message)
    patterns = [
        r"(?:до|не дороже|максимум|max|under|below)\s*(\d[\d\s]{2,})\s*(?:сом|kgs|usd|доллар)?",
        r"(\d[\d\s]{2,})\s*(?:сом|kgs|usd|доллар)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        raw = re.sub(r"\s+", "", match.group(1))
        try:
            return int(raw)
        except ValueError:
            return None
    return None


def parse_stay_guests(message: str) -> int | None:
    text = _normalize_text(message)
    words = {"двоих": 2, "троих": 3, "четверых": 4, "пятерых": 5}
    for word, value in words.items():
        if word in text:
            return value
    match = re.search(r"(?:на|для)?\s*(\d{1,2})\s*(?:гостей|гостя|человек|человека|people|guests)", text)
    if not match:
        return None
    return max(1, min(30, int(match.group(1))))


def parse_stay_rating(message: str) -> float | None:
    text = _normalize_text(message)
    match = re.search(r"(?:рейтинг|rating)\s*(?:от|>=|больше)?\s*(\d(?:[.,]\d)?)", text)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def parse_stay_amenities(message: str) -> list[str]:
    text = _normalize_text(message)
    amenity_map = {
        "wifi": ["wifi", "wi fi", "вайфай", "интернет"],
        "breakfast": ["breakfast", "завтрак"],
        "parking": ["parking", "парковка"],
        "shower": ["shower", "душ"],
        "heating": ["heating", "отопление", "тепло"],
    }
    amenities: list[str] = []
    for amenity, aliases in amenity_map.items():
        if any(alias in text for alias in aliases):
            amenities.append(amenity)
    return amenities


def parse_stay_filters(message: str) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    destination = resolve_stay_destination(message)
    stay_type = parse_stay_type(message)
    max_price = parse_stay_max_price(message)
    guests = parse_stay_guests(message)
    rating = parse_stay_rating(message)
    amenities = parse_stay_amenities(message)

    if destination:
        filters["location"] = destination
        filters["region"] = destination
    if stay_type:
        filters["type"] = stay_type
    if max_price:
        filters["max_price"] = max_price
    if guests:
        filters["guests"] = guests
    if rating:
        filters["rating"] = rating
    if amenities:
        filters["amenities"] = amenities
    return filters


def _media_url(url: str, request=None) -> str | None:
    if not url:
        return None
    if url.startswith(("http://", "https://", "//", "data:")):
        return url
    public_base_url = getattr(settings, "PUBLIC_BASE_URL", "")
    if public_base_url:
        return urljoin(f"{public_base_url}/", url.lstrip("/"))
    return request.build_absolute_uri(url) if request else url


def _stay_image_url(stay: Stay, request=None) -> str | None:
    image = getattr(stay, "image", None)
    if not image:
        return None
    raw = str(image)
    if raw.startswith(("http://", "https://", "//", "data:")):
        return raw
    try:
        url = image.url
    except (AttributeError, ValueError):
        return _media_url(raw, request)
    return _media_url(url, request)


def _format_price(value: Decimal | float | int) -> int | float:
    amount = float(value)
    return int(amount) if amount.is_integer() else round(amount, 2)


def _stay_matches_destination(stay: Stay, destination: str) -> bool:
    display = DESTINATION_DISPLAY.get(destination, destination)
    aliases = DESTINATION_ALIASES.get(destination, [destination, display])
    text = _normalize_text(
        " ".join(
            str(getattr(stay, field, "") or "")
            for field in ("title", "location", "region", "title_ru", "location_ru", "region_ru", "title_en", "location_en", "region_en")
        )
    )
    return any(_normalize_text(value) in text for value in {destination, display, *aliases} if value)


def _get_filtered_stays(filters: dict[str, Any] | None = None, limit: int = 40) -> list[Stay]:
    filters = filters or {}
    queryset: QuerySet[Stay] = Stay.objects.all().order_by("-rating", "price_per_night", "id")

    max_price = filters.get("max_price")
    if max_price:
        queryset = queryset.filter(price_per_night__lte=max_price)

    currency = filters.get("currency")
    if currency:
        queryset = queryset.filter(currency__iexact=str(currency))

    guests = filters.get("guests")
    if guests:
        queryset = queryset.filter(max_guests__gte=guests)

    stay_type = filters.get("type")
    if stay_type:
        aliases = STAY_TYPE_ALIASES.get(str(stay_type), [str(stay_type)])
        type_query = Q()
        for alias in aliases:
            type_query |= Q(type__icontains=alias)
        queryset = queryset.filter(type_query)

    rating = filters.get("rating")
    if rating:
        queryset = queryset.filter(rating__gte=rating)

    location = filters.get("location") or filters.get("region")
    stays = list(queryset[:limit])
    if location:
        stays = [stay for stay in stays if _stay_matches_destination(stay, str(location))]

    amenities = filters.get("amenities") or []
    if isinstance(amenities, str):
        amenities = [amenities]
    normalized_amenities = [_normalize_text(item) for item in amenities if item]
    if normalized_amenities:
        filtered = []
        for stay in stays:
            stay_amenities = getattr(stay, "amenities", None)
            if not isinstance(stay_amenities, list):
                stay_amenities = []
            amenity_text = _normalize_text(" ".join(str(item) for item in stay_amenities))
            if all(amenity in amenity_text for amenity in normalized_amenities):
                filtered.append(stay)
        stays = filtered

    return stays[:limit]


def _stay_to_dict(stay: Stay, request=None) -> dict[str, Any]:
    currency = (getattr(stay, "currency", "") or "USD").upper()
    amenities = getattr(stay, "amenities", None)
    if not isinstance(amenities, list):
        amenities = []
    return {
        "id": stay.id,
        "slug": stay.slug,
        "title": stay.title,
        "location": stay.location,
        "region": stay.region,
        "price_per_night": _format_price(stay.price_per_night),
        "currency": currency,
        "rating": stay.rating,
        "review_count": stay.review_count,
        "amenities": amenities[:12],
        "type": stay.type,
        "stay_type": stay.type,
        "max_guests": stay.max_guests,
        "hero": _stay_image_url(stay, request),
        "image": _stay_image_url(stay, request),
        "url": f"/stays/{stay.slug}",
    }


def _stay_to_card(stay: Stay, request=None) -> dict[str, Any]:
    data = _stay_to_dict(stay, request=request)
    data["stay_type"] = data.get("stay_type") or data.get("type")
    data["type"] = "stay"
    return data


def get_available_stays(filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    filters = filters or {}
    requested_limit = int(filters.get("limit") or 8)
    limit = max(1, min(20, requested_limit))
    stays = _get_filtered_stays(filters, limit=40)
    return [_stay_to_dict(stay) for stay in stays[:limit]]


def get_stay_cards(filters: dict[str, Any] | None = None, limit: int = 3, request=None) -> list[dict[str, Any]]:
    filters = filters or {}
    limit = int(filters.get("limit") or limit)
    limit = max(1, min(20, limit))
    stays = _get_filtered_stays(filters, limit=40)
    return [_stay_to_card(stay, request=request) for stay in stays[:limit]]
