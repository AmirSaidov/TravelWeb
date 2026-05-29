from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.core.cache import cache
from django.test import SimpleTestCase
import requests

from .intent_service import detect_language, resolve_intent
from .tour_service import _tour_matches_destination
from .views import _generate_ai_response
from .weather_service import (
    WEATHER_TIMEOUT_SECONDS,
    WeatherServiceError,
    compare_weather,
    get_weather,
)


class IntentResolverTests(SimpleTestCase):
    def test_explicit_tour_query_resolves_issyk_kul(self):
        resolved = resolve_intent("какие есть туры в ысык кол")

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["destination"], "issyk-kul")
        self.assertTrue(resolved["filters"]["strict_destination"])

    def test_weather_keywords_have_priority_over_destinations(self):
        first = resolve_intent("какая сейчас температура в ысик кол")
        second = resolve_intent("какая погода в оше")

        self.assertEqual(first["intent"], "weather")
        self.assertEqual(first["destination"], "issyk-kul")
        self.assertEqual(first["priority_match"], "weather_keyword")
        self.assertEqual(second["intent"], "weather")
        self.assertEqual(second["destination"], "osh")
        self.assertEqual(second["priority_match"], "weather_keyword")

    def test_weather_compare_keywords_have_highest_priority(self):
        resolved = resolve_intent("где самый теплый климат в Кыргызстане?")

        self.assertEqual(resolved["intent"], "weather_compare")
        self.assertEqual(resolved["priority_match"], "weather_compare_keyword")

    def test_weather_compare_keyword_does_not_become_tour_search(self):
        resolved = resolve_intent("сравни погоду по регионам Кыргызстана")

        self.assertEqual(resolved["intent"], "weather_compare")

    def test_english_weather_compare_intent_and_language(self):
        resolved = resolve_intent("Where is the warmest climate in Kyrgyzstan?")

        self.assertEqual(resolved["intent"], "weather_compare")
        self.assertEqual(resolved["language"], "en")

    def test_kyrgyz_weather_compare_intent_and_language(self):
        resolved = resolve_intent("Кыргызстанда эң жылуу климат кайсы жерде?")

        self.assertEqual(resolved["intent"], "weather_compare")
        self.assertEqual(resolved["language"], "ky")

    def test_tour_keywords_stay_tour_search(self):
        first = resolve_intent("какие туры на иссык-куль")
        second = resolve_intent("туры в каракол")

        self.assertEqual(first["intent"], "tour_search")
        self.assertEqual(first["destination"], "issyk-kul")
        self.assertEqual(second["intent"], "tour_search")
        self.assertEqual(second["destination"], "karakol")

    def test_english_tour_search_intent(self):
        resolved = resolve_intent("What tours are available?")

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["language"], "en")

    def test_kyrgyz_weather_search_intent(self):
        resolved = resolve_intent("Аба ырайы кандай?")

        self.assertEqual(resolved["intent"], "weather")
        self.assertEqual(resolved["language"], "ky")

    def test_language_detection_supports_ru_en_ky(self):
        self.assertEqual(detect_language("какая погода в оше"), "ru")
        self.assertEqual(detect_language("What's the weather in Osh?"), "en")
        self.assertEqual(detect_language("Аба ырайы кандай?"), "ky")

    def test_short_location_followup_inherits_tour_context(self):
        history = [
            {"role": "user", "content": "какие есть туры в ысык кол"},
            {
                "role": "assistant",
                "content": "Я нашел подходящие туры:",
                "cards": [{"type": "tour", "id": 1, "destination": "Иссык-Куль"}],
            },
        ]

        resolved = resolve_intent("а в Оше?", recent_messages=history)

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["destination"], "osh")
        self.assertTrue(resolved["filters"]["strict_destination"])

    def test_location_only_after_weather_keeps_weather_intent(self):
        history = [
            {"role": "user", "content": "какая погода?"},
            {"role": "assistant", "content": "Уточните город или место."},
        ]

        resolved = resolve_intent("Ош", recent_messages=history)

        self.assertEqual(resolved["intent"], "weather")
        self.assertEqual(resolved["destination"], "osh")

    def test_explicit_osh_tour_query_is_strict_tour_search(self):
        resolved = resolve_intent("нет какие есть туры в оше дай мне их все")

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["destination"], "osh")
        self.assertEqual(resolved["filters"]["limit"], 8)
        self.assertTrue(resolved["filters"]["strict_destination"])

    def test_another_tour_followup_inherits_destination_and_excludes_seen_cards(self):
        history = [
            {"role": "user", "content": "какие есть туры в ысык кол"},
            {
                "role": "assistant",
                "content": "Я нашел подходящий тур:",
                "cards": [{"type": "tour", "id": 14, "destination": "Иссык-Куль"}],
            },
        ]

        resolved = resolve_intent("а есть другой тур", recent_messages=history)

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["destination"], "issyk-kul")
        self.assertEqual(resolved["filters"]["exclude_ids"], [14])

    def test_requested_count_followup_inherits_tour_context(self):
        history = [
            {"role": "user", "content": "какие есть туры в ысык кол"},
            {
                "role": "assistant",
                "content": "Я нашел подходящий тур:",
                "cards": [{"type": "tour", "id": 14, "destination": "Иссык-Куль"}],
            },
        ]

        resolved = resolve_intent("5 вариантов", recent_messages=history)

        self.assertEqual(resolved["intent"], "tour_search")
        self.assertEqual(resolved["destination"], "issyk-kul")
        self.assertEqual(resolved["filters"]["limit"], 5)
        self.assertEqual(resolved["filters"]["exclude_ids"], [14])

    def test_clothing_question_resolves_to_packing(self):
        resolved = resolve_intent("что надеть в Оше?")

        self.assertEqual(resolved["intent"], "packing")
        self.assertEqual(resolved["destination"], "osh")


class TourDestinationFilterTests(SimpleTestCase):
    def test_strict_osh_does_not_match_son_kul_text(self):
        son_kul_tour = SimpleNamespace(
            title="Сон-Куль Adventure",
            location="Сон-Куль",
            description="Хороший горный тур у озера.",
        )

        self.assertFalse(_tour_matches_destination(son_kul_tour, "osh"))

    def test_strict_osh_matches_osh_region_text(self):
        osh_tour = SimpleNamespace(
            title="Маршрут по Ошской области",
            location="Ош",
            description="Тур вокруг города Ош.",
        )

        self.assertTrue(_tour_matches_destination(osh_tour, "osh"))


class WeatherServiceTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    @patch("ai.weather_service.logger")
    @patch("ai.weather_service.time.sleep", return_value=None)
    @patch("ai.weather_service.requests.get")
    def test_open_meteo_timeout_retries_and_returns_fallback(self, mocked_get, mocked_sleep, mocked_logger):
        mocked_get.side_effect = requests.Timeout("Read timed out.")

        weather = get_weather("osh")

        self.assertTrue(weather["is_fallback"])
        self.assertEqual(mocked_get.call_count, 3)
        self.assertEqual(mocked_sleep.call_count, 2)
        self.assertTrue(mocked_logger.exception.called)
        for call in mocked_get.call_args_list:
            self.assertEqual(call.kwargs["timeout"], WEATHER_TIMEOUT_SECONDS)

    @patch("ai.weather_service.requests.get")
    def test_weather_is_cached_for_repeated_requests(self, mocked_get):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "current": {
                "temperature_2m": 20,
                "apparent_temperature": 19,
                "precipitation": 0,
                "rain": 0,
                "snowfall": 0,
                "weather_code": 1,
                "wind_speed_10m": 5,
                "time": "2026-05-28T12:00",
            },
            "daily": {
                "time": ["2026-05-28"],
                "temperature_2m_max": [24],
                "temperature_2m_min": [12],
                "precipitation_sum": [0],
                "rain_sum": [0],
                "snowfall_sum": [0],
                "wind_speed_10m_max": [8],
                "weather_code": [1],
            },
        }
        mocked_get.return_value = response

        first = get_weather("osh")
        second = get_weather("osh")

        self.assertEqual(first["temperature"], 20)
        self.assertEqual(second["temperature"], 20)
        self.assertEqual(mocked_get.call_count, 1)

    @patch("ai.weather_service.get_weather")
    def test_compare_weather_skips_failed_locations_and_sorts_top_three(self, mocked_get_weather):
        weather_by_location = {
            "Бишкек": {
                "location": "Бишкек",
                "temperature": 20,
                "weather_description": "Ясно",
                "wind_speed": 5,
                "precipitation": 0,
            },
            "Ош": {
                "location": "Ош",
                "temperature": 26,
                "weather_description": "Ясно",
                "wind_speed": 4,
                "precipitation": 0,
            },
            "Джалал-Абад": {
                "location": "Джалал-Абад",
                "temperature": 25,
                "weather_description": "Облачно",
                "wind_speed": 7,
                "precipitation": 0.1,
            },
            "Баткен": {
                "location": "Баткен",
                "temperature": 24,
                "weather_description": "Ясно",
                "wind_speed": 8,
                "precipitation": 0,
            },
            "Нарын": {"location": "Нарын", "temperature": None, "is_fallback": True},
        }

        def weather_side_effect(location):
            if location == "Каракол":
                raise WeatherServiceError("temporary failure")
            return weather_by_location[location]

        mocked_get_weather.side_effect = weather_side_effect

        with patch("ai.weather_service.logger"):
            result = compare_weather(["Бишкек", "Ош", "Джалал-Абад", "Баткен", "Нарын", "Каракол"])

        self.assertEqual([item["location"] for item in result], ["Ош", "Джалал-Абад", "Баткен"])
        self.assertEqual(result[0]["temperature"], 26)


class WeatherCardResponseTests(SimpleTestCase):
    @patch("ai.views.get_available_tours")
    @patch("ai.views.get_weather")
    def test_weather_intent_returns_structured_card_without_tour_lookup(self, mocked_weather, mocked_tours):
        mocked_weather.return_value = {
            "location": "Ош",
            "temperature": 20.4,
            "weather_description": "Морось",
            "wind_speed": 14.5,
            "precipitation": 0.2,
            "temp_min": 13.7,
            "temp_max": 25.9,
            "tourist_recommendation": "Для прогулки подойдет легкая одежда, но возьмите кофту на вечер.",
        }

        response = _generate_ai_response("какая погода в оше", context={})

        self.assertEqual(response["answer"], "Вот актуальная погода:")
        self.assertEqual(response["cards"][0]["type"], "weather")
        self.assertEqual(response["cards"][0]["location"], "Ош")
        self.assertEqual(response["cards"][0]["temperature"], 20.4)
        self.assertEqual(response["cards"][0]["description"], "Морось")
        self.assertEqual(response["cards"][0]["wind_speed"], 14.5)
        self.assertEqual(response["cards"][0]["precipitation"], 0.2)
        self.assertEqual(response["cards"][0]["temp_min"], 13.7)
        self.assertEqual(response["cards"][0]["temp_max"], 25.9)
        self.assertIn("легкая одежда", response["cards"][0]["recommendation"])
        mocked_tours.assert_not_called()

    def test_weather_compare_returns_markdown_without_tour_lookup(self):
        with patch("ai.views.compare_weather") as mocked_compare, patch("ai.views.get_available_tours") as mocked_tours:
            mocked_compare.return_value = [
                {"location": "Ош", "temperature": 26, "weather_description": "Ясно", "wind_speed": 4, "precipitation": 0},
                {
                    "location": "Джалал-Абад",
                    "temperature": 25,
                    "weather_description": "Облачно",
                    "wind_speed": 7,
                    "precipitation": 0.1,
                },
                {"location": "Баткен", "temperature": 24, "weather_description": "Ясно", "wind_speed": 8, "precipitation": 0},
            ]

            response = _generate_ai_response("где самый теплый климат в Кыргызстане?", context={})

        self.assertIn("Сейчас теплее всего", response["answer"])
        self.assertIn("1. **Ош**", response["answer"])
        self.assertIn("2. **Джалал-Абад**", response["answer"])
        self.assertIn("3. **Баткен**", response["answer"])
        self.assertIn("Обычно самый теплый климат", response["answer"])
        mocked_tours.assert_not_called()

    def test_english_weather_compare_answer_uses_user_language(self):
        with patch("ai.views.compare_weather") as mocked_compare, patch("ai.views.get_available_tours") as mocked_tours:
            mocked_compare.return_value = [
                {"location": "Ош", "temperature": 26, "weather_description": "Ясно"},
                {"location": "Джалал-Абад", "temperature": 25, "weather_description": "Облачно"},
                {"location": "Баткен", "temperature": 24, "weather_description": "Ясно"},
            ]

            response = _generate_ai_response("Where is the warmest climate in Kyrgyzstan?", context={})

        self.assertIn("Currently the warmest locations", response["answer"])
        self.assertIn("1. **Osh**", response["answer"])
        self.assertIn("2. **Jalal-Abad**", response["answer"])
        self.assertIn("Usually, the warmest climate", response["answer"])
        mocked_tours.assert_not_called()

    def test_kyrgyz_weather_compare_answer_uses_user_language(self):
        with patch("ai.views.compare_weather") as mocked_compare, patch("ai.views.get_available_tours") as mocked_tours:
            mocked_compare.return_value = [
                {"location": "Ош", "temperature": 26, "weather_description": "Ясно"},
                {"location": "Джалал-Абад", "temperature": 25, "weather_description": "Облачно"},
                {"location": "Баткен", "temperature": 24, "weather_description": "Ясно"},
            ]

            response = _generate_ai_response("Кыргызстанда эң жылуу климат кайсы жерде?", context={})

        self.assertIn("Азыр эң жылуу жерлер", response["answer"])
        self.assertIn("1. **Ош**", response["answer"])
        self.assertIn("2. **Жалал-Абад**", response["answer"])
        self.assertIn("Кыргызстанда эң жылуу климат", response["answer"])
        mocked_tours.assert_not_called()

    def test_weather_compare_returns_fallback_when_all_locations_fail(self):
        with patch("ai.views.compare_weather", return_value=[]), patch("ai.views.get_available_tours") as mocked_tours:
            response = _generate_ai_response("где теплее сейчас?", context={})

        self.assertEqual(
            response["answer"],
            "Сейчас не удалось сравнить live-погоду. Обычно теплее всего на юге: Ош, Джалал-Абад, Баткен.",
        )
        mocked_tours.assert_not_called()
