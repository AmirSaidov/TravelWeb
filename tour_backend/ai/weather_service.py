from __future__ import annotations

from datetime import date as date_cls
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from zoneinfo import ZoneInfoNotFoundError
import logging
import re
import time
from typing import Any

from django.core.cache import cache
import requests


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
WEATHER_TIMEOUT_SECONDS = 20
WEATHER_RETRY_COUNT = 2
WEATHER_RETRY_DELAY_SECONDS = 0.7
WEATHER_CACHE_SECONDS = 10 * 60
WEATHER_TIMEZONE = "Asia/Bishkek"
WEATHER_FALLBACK_MESSAGE = "Сейчас live-прогноз временно недоступен. Могу дать сезонную рекомендацию."

logger = logging.getLogger(__name__)


class WeatherServiceError(Exception):
    pass


KYRGYZSTAN_LOCATIONS = {
    "бишкек": {"lat": 42.8746, "lon": 74.5698, "display": "Бишкек"},
    "bishkek": {"lat": 42.8746, "lon": 74.5698, "display": "Бишкек"},
    "ош": {"lat": 40.5139, "lon": 72.8161},
    "osh": {"lat": 40.5139, "lon": 72.8161},
    "karakol": {"lat": 42.4907, "lon": 78.3936},
    "каракол": {"lat": 42.4907, "lon": 78.3936},
    "cholpon-ata": {"lat": 42.6494, "lon": 77.0823},
    "чолпон-ата": {"lat": 42.6494, "lon": 77.0823},
    "issyk-kul": {"lat": 42.1855, "lon": 77.5619},
    "иссык-куль": {"lat": 42.1855, "lon": 77.5619},
    "son-kul": {"lat": 41.8350, "lon": 75.1510},
    "сон-куль": {"lat": 41.8350, "lon": 75.1510},
    "naryn": {"lat": 41.4287, "lon": 75.9911},
    "нарын": {"lat": 41.4287, "lon": 75.9911},
    "jalal-abad": {"lat": 40.9333, "lon": 73.0000},
    "talas": {"lat": 42.5228, "lon": 72.2427},
    "batken": {"lat": 40.0626, "lon": 70.8194},
    "ala-archa": {"lat": 42.6510, "lon": 74.4896},
    "ала-арча": {"lat": 42.6510, "lon": 74.4896},
    "kel-suu": {"lat": 41.8417, "lon": 76.3275},
    "arslanbob": {"lat": 41.3417, "lon": 72.9372},
    "sary-chelek": {"lat": 41.8737, "lon": 71.9540},
}


LOCATIONS: dict[str, dict[str, Any]] = {
    "bishkek": {
        "name": KYRGYZSTAN_LOCATIONS["bishkek"]["display"],
        "lat": KYRGYZSTAN_LOCATIONS["bishkek"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["bishkek"]["lon"],
        "is_mountain": False,
        "aliases": ["бишкек", "бишкеке", "bishkek"],
    },
    "osh": {
        "name": "Ош",
        "lat": KYRGYZSTAN_LOCATIONS["osh"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["osh"]["lon"],
        "is_mountain": False,
        "aliases": ["ош", "оше", "osh"],
    },
    "karakol": {
        "name": "Каракол",
        "lat": KYRGYZSTAN_LOCATIONS["karakol"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["karakol"]["lon"],
        "is_mountain": True,
        "aliases": ["каракол", "караколе", "karakol"],
    },
    "cholpon_ata": {
        "name": "Чолпон-Ата",
        "lat": KYRGYZSTAN_LOCATIONS["cholpon-ata"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["cholpon-ata"]["lon"],
        "is_mountain": False,
        "aliases": ["чолпон ата", "чолпон ате", "чолпон-ата", "cholpon ata", "cholpon-ata"],
    },
    "naryn": {
        "name": "Нарын",
        "lat": KYRGYZSTAN_LOCATIONS["naryn"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["naryn"]["lon"],
        "is_mountain": True,
        "aliases": ["нарын", "нарыне", "naryn"],
    },
    "jalal_abad": {
        "name": "Джалал-Абад",
        "lat": KYRGYZSTAN_LOCATIONS["jalal-abad"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["jalal-abad"]["lon"],
        "is_mountain": False,
        "aliases": ["джалал абад", "джалал абаде", "джалал-абад", "jalal abad", "jalal-abad"],
    },
    "talas": {
        "name": "Талас",
        "lat": KYRGYZSTAN_LOCATIONS["talas"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["talas"]["lon"],
        "is_mountain": False,
        "aliases": ["талас", "таласе", "talas"],
    },
    "batken": {
        "name": "Баткен",
        "lat": KYRGYZSTAN_LOCATIONS["batken"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["batken"]["lon"],
        "is_mountain": False,
        "aliases": ["баткен", "баткене", "batken"],
    },
    "ala_archa": {
        "name": "Ала-Арча",
        "lat": KYRGYZSTAN_LOCATIONS["ala-archa"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["ala-archa"]["lon"],
        "is_mountain": True,
        "aliases": ["ала арча", "ала арче", "ала-арча", "ala archa", "ala-archa"],
    },
    "son_kul": {
        "name": "Сон-Куль",
        "lat": KYRGYZSTAN_LOCATIONS["son-kul"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["son-kul"]["lon"],
        "is_mountain": True,
        "aliases": ["сон куль", "сон куле", "сон-куль", "сонкуль", "song kul", "son kul", "son-kul"],
    },
    "issyk_kul": {
        "name": "Иссык-Куль",
        "lat": KYRGYZSTAN_LOCATIONS["issyk-kul"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["issyk-kul"]["lon"],
        "is_mountain": False,
        "aliases": [
            "иссык куль",
            "иссык куле",
            "иссык-куль",
            "ысык кол",
            "ысык көл",
            "ысик кол",
            "ысик көл",
            "ысик кул",
            "issyk kul",
            "issyk-kul",
            "issyk lake",
        ],
    },
    "kel_suu": {
        "name": "Кель-Суу",
        "lat": KYRGYZSTAN_LOCATIONS["kel-suu"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["kel-suu"]["lon"],
        "is_mountain": True,
        "aliases": ["кель суу", "кель-суу", "кол суу", "кол-суу", "kel suu", "kel-suu", "kol suu", "kol-suu"],
    },
    "arslanbob": {
        "name": "Арсланбоб",
        "lat": KYRGYZSTAN_LOCATIONS["arslanbob"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["arslanbob"]["lon"],
        "is_mountain": True,
        "aliases": ["арсланбоб", "arslanbob"],
    },
    "sary_chelek": {
        "name": "Сары-Челек",
        "lat": KYRGYZSTAN_LOCATIONS["sary-chelek"]["lat"],
        "lon": KYRGYZSTAN_LOCATIONS["sary-chelek"]["lon"],
        "is_mountain": True,
        "aliases": ["сары челек", "сары-челек", "sary chelek", "sary-chelek"],
    },
}


WEATHER_KEYWORDS = [
    "погода",
    "прогноз",
    "температур",
    "градус",
    "дожд",
    "снег",
    "ветер",
    "осад",
    "будет ли",
    "холодно",
    "жарко",
    "тепло",
    "зонт",
    "куртк",
    "пальто",
    "обув",
    "что надеть",
    "что одеть",
    "как одеться",
    "одеться",
    "одеть",
    "надевать",
    "одежд",
    "ехать в горы",
    "ехать ли в горы",
    "в горы",
    "можно ехать",
    "можно ли ехать",
    "weather",
    "forecast",
    "temperature",
    "rain",
    "snow",
    "wind",
    "what to wear",
    "аба ырайы",
]


WEATHER_CODE_DESCRIPTIONS = {
    0: "Ясно",
    1: "Облачно",
    2: "Облачно",
    3: "Облачно",
    45: "Туман",
    48: "Туман",
    51: "Морось",
    53: "Морось",
    55: "Морось",
    61: "Дождь",
    63: "Дождь",
    65: "Дождь",
    71: "Снег",
    73: "Снег",
    75: "Снег",
    80: "Ливень",
    81: "Ливень",
    82: "Ливень",
    95: "Гроза",
}


def _normalize_text(value: str) -> str:
    normalized = value.lower().replace("ё", "е").replace("-", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def _today() -> date_cls:
    try:
        tzinfo = ZoneInfo(WEATHER_TIMEZONE)
    except ZoneInfoNotFoundError:
        tzinfo = timezone(timedelta(hours=6))
    return datetime.now(tzinfo).date()


def is_weather_request(message: str) -> bool:
    text = _normalize_text(message)
    return any(keyword in text for keyword in WEATHER_KEYWORDS)


def resolve_location(message: str) -> str | None:
    text = f" {_normalize_text(message)} "
    matches: list[tuple[int, str]] = []

    for key, meta in LOCATIONS.items():
        for alias in meta["aliases"]:
            normalized_alias = _normalize_text(alias)
            pattern = rf"(?<!\w){re.escape(normalized_alias)}(?!\w)"
            if re.search(pattern, text):
                matches.append((len(normalized_alias), key))

    if not matches:
        return None

    return sorted(matches, reverse=True)[0][1]


def is_known_location(message: str) -> bool:
    return resolve_location(message) is not None


def parse_weather_date(message: str) -> str | None:
    text = _normalize_text(message)
    today = _today()

    if "послезавтра" in text:
        return (today + timedelta(days=2)).isoformat()
    if "завтра" in text or "tomorrow" in text:
        return (today + timedelta(days=1)).isoformat()
    if "сегодня" in text or "сейчас" in text or "today" in text or "now" in text:
        return None

    iso_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
    if iso_match:
        return iso_match.group(1)

    date_match = re.search(r"\b(\d{1,2})[./](\d{1,2})(?:[./](20\d{2}))?\b", text)
    if date_match:
        day = int(date_match.group(1))
        month = int(date_match.group(2))
        year = int(date_match.group(3) or today.year)
        try:
            return date_cls(year, month, day).isoformat()
        except ValueError:
            return None

    return None


def _weather_description(code: int | None) -> str:
    if code is None:
        return "нет описания"
    return WEATHER_CODE_DESCRIPTIONS.get(int(code), f"код погоды {code}")


def _round_or_none(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return round(float(value), 1)
    return None


def _tourist_recommendation(
    *,
    location_name: str,
    temperature: float | None,
    precipitation: float | None,
    rain: float | None,
    snowfall: float | None,
    wind_speed: float | None,
    is_mountain: bool,
) -> str:
    tips: list[str] = []

    if temperature is not None:
        if temperature < 0:
            tips.append("нужна зимняя одежда, теплая обувь, шапка и перчатки")
        elif temperature < 8:
            tips.append("лучше надеть теплые слои и ветровку")
        elif temperature < 18:
            tips.append("подойдут слои одежды и легкая куртка")
        elif temperature > 28:
            tips.append("берите легкую одежду, воду, кепку и солнцезащитный крем")
        else:
            tips.append("для прогулки подойдет легкая одежда, но возьмите кофту на вечер")

    wet_amount = max(precipitation or 0, rain or 0, snowfall or 0)
    if wet_amount > 0:
        tips.append("возьмите непромокаемую куртку и обувь")

    if wind_speed is not None and wind_speed >= 30:
        tips.append("из-за ветра лучше иметь ветрозащитную куртку и быть осторожнее на открытых участках")

    if is_mountain:
        tips.append(f"в районе {location_name} учитывайте, что в горах погода меняется быстрее, чем в городе")

    if not tips:
        tips.append("серьезных погодных ограничений по прогнозу не видно")

    return "; ".join(tips).capitalize() + "."


def _open_meteo_params(location_meta: dict[str, Any]) -> dict[str, Any]:
    return {
        "latitude": location_meta["lat"],
        "longitude": location_meta["lon"],
        "current": "temperature_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max",
        "timezone": WEATHER_TIMEZONE,
        "forecast_days": 7,
    }


def _request_open_meteo(location_meta: dict[str, Any]) -> dict[str, Any]:
    params = _open_meteo_params(location_meta)
    last_error: Exception | None = None

    for attempt in range(WEATHER_RETRY_COUNT + 1):
        try:
            response = requests.get(
                OPEN_METEO_URL,
                params=params,
                timeout=WEATHER_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict):
                raise WeatherServiceError("Open-Meteo returned invalid response")
            return data
        except (requests.RequestException, ValueError, WeatherServiceError) as exc:
            last_error = exc
            if attempt < WEATHER_RETRY_COUNT:
                logger.warning(
                    "Open-Meteo request attempt %s/%s failed: %s",
                    attempt + 1,
                    WEATHER_RETRY_COUNT + 1,
                    exc,
                )
                time.sleep(WEATHER_RETRY_DELAY_SECONDS * (attempt + 1))
                continue

            logger.exception("Open-Meteo request failed after %s attempts", WEATHER_RETRY_COUNT + 1)

    raise WeatherServiceError("Open-Meteo request failed") from last_error


def _daily_summary_for_date(data: dict[str, Any], weather_date: str) -> dict[str, Any]:
    daily = data.get("daily")
    if not isinstance(daily, dict) or not isinstance(daily.get("time"), list):
        return {}

    try:
        index = daily["time"].index(weather_date)
    except ValueError:
        return {}

    def daily_value(key: str) -> Any:
        values = daily.get(key)
        if not isinstance(values, list) or index >= len(values):
            return None
        return values[index]

    return {
        "temp_max": _round_or_none(daily_value("temperature_2m_max")),
        "temp_min": _round_or_none(daily_value("temperature_2m_min")),
        "daily_precipitation": _round_or_none(daily_value("precipitation_sum")),
        "daily_rain": _round_or_none(daily_value("rain_sum")),
        "daily_snowfall": _round_or_none(daily_value("snowfall_sum")),
        "daily_wind_speed": _round_or_none(daily_value("wind_speed_10m_max")),
        "daily_weather_code": daily_value("weather_code"),
    }


def _weather_from_current(location_key: str, data: dict[str, Any]) -> dict[str, Any]:
    location_meta = LOCATIONS[location_key]
    current = data.get("current")
    if not isinstance(current, dict):
        raise WeatherServiceError("Open-Meteo current weather is missing")

    temperature = _round_or_none(current.get("temperature_2m"))
    feels_like = _round_or_none(current.get("apparent_temperature"))
    precipitation = _round_or_none(current.get("precipitation"))
    rain = _round_or_none(current.get("rain"))
    snowfall = _round_or_none(current.get("snowfall"))
    wind_speed = _round_or_none(current.get("wind_speed_10m"))
    weather_code = current.get("weather_code")
    weather_date = str(current.get("time") or _today().isoformat())[:10]
    daily_summary = _daily_summary_for_date(data, weather_date)
    recommendation = _tourist_recommendation(
        location_name=location_meta["name"],
        temperature=temperature,
        precipitation=precipitation,
        rain=rain,
        snowfall=snowfall,
        wind_speed=wind_speed,
        is_mountain=bool(location_meta.get("is_mountain")),
    )

    return {
        "location": location_meta["name"],
        "temperature": temperature,
        "feels_like": feels_like,
        "precipitation": precipitation,
        "rain": rain,
        "snowfall": snowfall,
        "wind_speed": wind_speed,
        "weather_code": weather_code,
        "weather_description": _weather_description(weather_code),
        "temp_max": daily_summary.get("temp_max"),
        "temp_min": daily_summary.get("temp_min"),
        "temperature_max": daily_summary.get("temp_max"),
        "temperature_min": daily_summary.get("temp_min"),
        "date": weather_date,
        "source": "Open-Meteo",
        "tourist_recommendation": recommendation,
        "recommendation": recommendation,
    }


def _weather_from_daily(location_key: str, data: dict[str, Any], weather_date: str) -> dict[str, Any]:
    location_meta = LOCATIONS[location_key]
    daily = data.get("daily")
    if not isinstance(daily, dict) or not isinstance(daily.get("time"), list):
        raise WeatherServiceError("Open-Meteo daily weather is missing")

    try:
        index = daily["time"].index(weather_date)
    except ValueError as exc:
        raise WeatherServiceError("Weather forecast for this date is unavailable") from exc

    def daily_value(key: str) -> Any:
        values = daily.get(key)
        if not isinstance(values, list) or index >= len(values):
            return None
        return values[index]

    temp_max = _round_or_none(daily_value("temperature_2m_max"))
    temp_min = _round_or_none(daily_value("temperature_2m_min"))
    temperature = None
    if temp_max is not None and temp_min is not None:
        temperature = round((temp_max + temp_min) / 2, 1)

    precipitation = _round_or_none(daily_value("precipitation_sum"))
    rain = _round_or_none(daily_value("rain_sum"))
    snowfall = _round_or_none(daily_value("snowfall_sum"))
    wind_speed = _round_or_none(daily_value("wind_speed_10m_max"))
    weather_code = daily_value("weather_code")
    recommendation = _tourist_recommendation(
        location_name=location_meta["name"],
        temperature=temperature,
        precipitation=precipitation,
        rain=rain,
        snowfall=snowfall,
        wind_speed=wind_speed,
        is_mountain=bool(location_meta.get("is_mountain")),
    )

    return {
        "location": location_meta["name"],
        "temperature": temperature,
        "temperature_min": temp_min,
        "temperature_max": temp_max,
        "temp_min": temp_min,
        "temp_max": temp_max,
        "feels_like": None,
        "precipitation": precipitation,
        "rain": rain,
        "snowfall": snowfall,
        "wind_speed": wind_speed,
        "weather_code": weather_code,
        "weather_description": _weather_description(weather_code),
        "date": weather_date,
        "source": "Open-Meteo",
        "tourist_recommendation": recommendation,
        "recommendation": recommendation,
    }


def _weather_cache_key(location_key: str, date: str | None = None) -> str:
    return f"ai:weather:{location_key}:{date or 'current'}"


def _fallback_weather_response(location_key: str, date: str | None = None) -> dict[str, Any]:
    location_meta = LOCATIONS[location_key]
    return {
        "location": location_meta["name"],
        "temperature": None,
        "feels_like": None,
        "precipitation": None,
        "rain": None,
        "snowfall": None,
        "wind_speed": None,
        "weather_code": None,
        "weather_description": "live forecast unavailable",
        "temp_max": None,
        "temp_min": None,
        "temperature_max": None,
        "temperature_min": None,
        "date": date or _today().isoformat(),
        "source": "Open-Meteo",
        "is_fallback": True,
        "weather_unavailable": True,
        "message": WEATHER_FALLBACK_MESSAGE,
        "tourist_recommendation": WEATHER_FALLBACK_MESSAGE,
        "recommendation": WEATHER_FALLBACK_MESSAGE,
    }


def get_weather(location_name: str, date: str | None = None) -> dict[str, Any]:
    location_key = location_name if location_name in LOCATIONS else resolve_location(location_name)
    if not location_key:
        raise WeatherServiceError("Unknown Kyrgyzstan location")

    cache_key = _weather_cache_key(location_key, date)
    cached_weather = cache.get(cache_key)
    if isinstance(cached_weather, dict):
        return cached_weather

    try:
        data = _request_open_meteo(LOCATIONS[location_key])
        weather = _weather_from_current(location_key, data) if not date else _weather_from_daily(location_key, data, date)
        cache.set(cache_key, weather, WEATHER_CACHE_SECONDS)
        return weather
    except WeatherServiceError:
        logger.exception("Weather fallback used location=%s date=%s", location_key, date)
        return _fallback_weather_response(location_key, date)


def compare_weather(locations: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    for location in locations:
        try:
            weather = get_weather(location)
        except WeatherServiceError:
            logger.exception("Weather comparison failed for location=%s", location)
            continue

        if weather.get("is_fallback"):
            logger.warning("Weather comparison skipped fallback location=%s", location)
            continue

        temperature = weather.get("temperature")
        if not isinstance(temperature, (int, float)):
            logger.warning("Weather comparison skipped location=%s without temperature", location)
            continue

        results.append(
            {
                "location": weather.get("location") or str(location),
                "temperature": temperature,
                "weather_description": weather.get("weather_description") or weather.get("description") or "",
                "wind_speed": weather.get("wind_speed"),
                "precipitation": weather.get("precipitation"),
            }
        )

    return sorted(results, key=lambda item: item["temperature"], reverse=True)[:3]
