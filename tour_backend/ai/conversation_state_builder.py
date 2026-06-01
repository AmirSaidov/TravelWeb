from __future__ import annotations

import re
from typing import Any

from .weather_service import LOCATIONS, resolve_location


MAX_STATE_MESSAGES = 12


def _text(value: Any) -> str:
    return str(value or "").strip()


def _normalize(value: Any) -> str:
    text = _text(value).lower().replace("ё", "е").replace("-", " ")
    return re.sub(r"\s+", " ", text).strip()


def _message_items(recent_messages: Any) -> list[dict[str, Any]]:
    if not isinstance(recent_messages, list):
        return []

    items: list[dict[str, Any]] = []
    for item in recent_messages[-MAX_STATE_MESSAGES:]:
        if isinstance(item, dict):
            role = item.get("role")
            content = item.get("content") if "content" in item else item.get("text")
            cards = item.get("cards")
        else:
            role = getattr(item, "role", None)
            content = getattr(item, "content", None)
            cards = getattr(item, "cards", None)

        role = _text(role).lower()
        if role not in {"user", "assistant", "system"}:
            continue
        items.append({"role": role, "content": _text(content), "cards": cards if isinstance(cards, list) else []})
    return items


def _display_location(location_key_or_name: str | None) -> str | None:
    if not location_key_or_name:
        return None
    key = location_key_or_name if location_key_or_name in LOCATIONS else resolve_location(location_key_or_name)
    if key and key in LOCATIONS:
        return LOCATIONS[key]["name"]
    return location_key_or_name


def _extract_location_from_text(content: str) -> str | None:
    location = resolve_location(content)
    return _display_location(location)


def _extract_locations_from_text(content: str) -> list[str]:
    normalized = f" {_normalize(content)} "
    found: list[str] = []
    seen: set[str] = set()
    for key, meta in LOCATIONS.items():
        for alias in meta.get("aliases", []):
            alias_text = _normalize(alias)
            if not alias_text:
                continue
            pattern = rf"(?<!\w){re.escape(alias_text)}(?!\w)"
            if re.search(pattern, normalized):
                display = _display_location(key)
                if display and display not in seen:
                    found.append(display)
                    seen.add(display)
                break
    return found


def _extract_time_context(content: str) -> str | None:
    text = _normalize(content)
    if any(word in text for word in ["вечер", "вечером", "evening", "night", "ночью"]):
        return "evening"
    if any(word in text for word in ["утро", "утром", "morning"]):
        return "morning"
    if any(word in text for word in ["днем", "день", "daytime", "afternoon"]):
        return "daytime"
    if any(word in text for word in ["завтра", "tomorrow"]):
        return "tomorrow"
    return None


def _is_packing_goal(content: str) -> bool:
    text = _normalize(content)
    goal_markers = [
        "что надеть",
        "что одеть",
        "как одеться",
        "одежд",
        "взять",
        "с собой",
        "куртк",
        "обув",
        "what to wear",
        "pack",
        "packing",
    ]
    return any(marker in text for marker in goal_markers)


def _is_weather_goal(content: str) -> bool:
    text = _normalize(content)
    weather_markers = ["погода", "прогноз", "температур", "дожд", "снег", "ветер", "weather", "forecast", "temperature"]
    return any(marker in text for marker in weather_markers)


def _is_tour_goal(content: str) -> bool:
    text = _normalize(content)
    tour_markers = ["тур", "туры", "куда поехать", "посовет", "recommend", "suggest tour"]
    return any(marker in text for marker in tour_markers)


def _extract_preferences(content: str) -> list[str]:
    text = _normalize(content)
    preferences: list[str] = []
    markers = {
        "calm": ["спокой", "тихо", "без толпы", "calm", "quiet"],
        "nature": ["природ", "горы", "ущель", "nature", "mountains", "hiking"],
        "family": ["с детьми", "дет", "семь", "kids", "family"],
        "budget": ["дешев", "подешевле", "эконом", "budget", "cheap"],
        "comfort": ["комфорт", "удоб", "comfort"],
    }
    for preference, aliases in markers.items():
        if any(alias in text for alias in aliases):
            preferences.append(preference)
    return preferences


def _extract_constraints(content: str) -> list[str]:
    text = _normalize(content)
    constraints: list[str] = []
    markers = {
        "short_transfers": ["без долгих переездов", "не далеко", "рядом", "nearby", "short transfers"],
        "short_trip": ["на 1 день", "на один день", "на 2 дня", "на два дня", "weekend"],
        "evening": ["вечер", "вечером", "evening"],
    }
    for constraint, aliases in markers.items():
        if any(alias in text for alias in aliases):
            constraints.append(constraint)
    return constraints


def _last_recommended_tours_from_cards(cards: list[Any]) -> list[dict[str, Any]]:
    tours: list[dict[str, Any]] = []
    for card in cards:
        if not isinstance(card, dict) or card.get("type") != "tour":
            continue
        tours.append(
            {
                "id": card.get("id"),
                "title": card.get("title"),
                "destination": card.get("destination"),
            }
        )
    return tours


def build_conversation_state(recent_messages) -> dict:
    items = _message_items(recent_messages)
    state: dict[str, Any] = {
        "current_topic": None,
        "user_goal": None,
        "last_destination": None,
        "compared_destinations": [],
        "time_context": None,
        "preferences": [],
        "constraints": [],
        "last_recommended_tours": [],
    }

    preferences: list[str] = []
    constraints: list[str] = []
    compared_destinations: list[str] = []

    for item in items:
        content = item.get("content") or ""
        if item.get("role") == "assistant":
            tours = _last_recommended_tours_from_cards(item.get("cards") or [])
            if tours:
                state["last_recommended_tours"] = tours
            weather_cards = [card for card in item.get("cards") or [] if isinstance(card, dict) and card.get("type") == "weather"]
            if weather_cards and not state.get("last_destination"):
                state["last_destination"] = _display_location(weather_cards[-1].get("location"))
            continue

        if item.get("role") != "user":
            continue

        locations = _extract_locations_from_text(content)
        if locations:
            state["last_destination"] = locations[-1]
            if len(locations) >= 2:
                compared_destinations = locations[-2:]

        time_context = _extract_time_context(content)
        if time_context:
            state["time_context"] = time_context

        if _is_packing_goal(content):
            state["current_topic"] = "packing_advice"
            if state.get("time_context") == "evening":
                state["user_goal"] = "what to wear/take in the evening"
            else:
                state["user_goal"] = "what to wear/take"
        elif _is_weather_goal(content):
            state["current_topic"] = "weather"
            state["user_goal"] = "live weather advice"
        elif _is_tour_goal(content):
            state["current_topic"] = "tour_recommendation"
            state["user_goal"] = "choose a suitable tour"

        for preference in _extract_preferences(content):
            if preference not in preferences:
                preferences.append(preference)
        for constraint in _extract_constraints(content):
            if constraint not in constraints:
                constraints.append(constraint)

    state["preferences"] = preferences
    state["constraints"] = constraints
    state["compared_destinations"] = compared_destinations
    return state
