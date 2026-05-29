from decimal import Decimal

from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings

from .models import Tour
from .serializers import make_absolute_media_url


class MediaUrlTests(SimpleTestCase):
    def test_public_base_url_is_used_for_relative_media_urls(self):
        with override_settings(PUBLIC_BASE_URL="https://example.pythonanywhere.com"):
            self.assertEqual(
                make_absolute_media_url("/media/tours/photo.jpg"),
                "https://example.pythonanywhere.com/media/tours/photo.jpg",
            )

    def test_request_builds_absolute_media_url_when_public_base_is_missing(self):
        request = RequestFactory().get("/api/tours/", secure=True, HTTP_HOST="api.example.com")

        with override_settings(PUBLIC_BASE_URL="", ALLOWED_HOSTS=["api.example.com"]):
            self.assertEqual(
                make_absolute_media_url("/media/tours/photo.jpg", request),
                "https://api.example.com/media/tours/photo.jpg",
            )

    def test_external_urls_are_preserved(self):
        url = "https://cdn.example.com/tours/photo.jpg"

        self.assertEqual(make_absolute_media_url(url), url)


class TourApiLanguageTests(TestCase):
    def setUp(self):
        self.tour = Tour.objects.create(
            title="Fallback title",
            title_ru="Русский заголовок",
            title_en="English title",
            title_ky="Кыргызча аталыш",
            description="Fallback description",
            description_ru="Русское описание",
            description_en="English description",
            description_ky="Кыргызча сүрөттөмө",
            price=Decimal("3500.00"),
            currency="KGS",
            location="Fallback location",
            location_ru="Русская локация",
            location_en="English location",
            location_ky="Кыргызча жер",
            duration=2,
            difficulty="Easy",
            types=[],
            max_people=8,
            image="tours/test.jpg",
        )

    def test_tours_api_lang_ru_returns_russian_fields(self):
        response = self.client.get("/api/tours/?lang=ru")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["title"], "Русский заголовок")
        self.assertEqual(response.json()[0]["description"], "Русское описание")
        self.assertEqual(response.json()[0]["location"], "Русская локация")

    def test_tours_api_lang_en_returns_english_fields(self):
        response = self.client.get("/api/tours/?lang=en")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["title"], "English title")
        self.assertEqual(response.json()[0]["description"], "English description")
        self.assertEqual(response.json()[0]["location"], "English location")

    def test_tours_api_lang_ky_returns_kyrgyz_fields(self):
        response = self.client.get("/api/tours/?lang=ky")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["title"], "Кыргызча аталыш")
        self.assertEqual(response.json()[0]["description"], "Кыргызча сүрөттөмө")
        self.assertEqual(response.json()[0]["location"], "Кыргызча жер")

    def test_tours_api_lang_falls_back_to_default_fields_when_translation_is_empty(self):
        self.tour.title_en = ""
        self.tour.description_en = ""
        self.tour.location_en = ""
        self.tour.save(update_fields=["title_en", "description_en", "location_en"])

        response = self.client.get("/api/tours/?lang=en")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["title"], "Fallback title")
        self.assertEqual(response.json()[0]["description"], "Fallback description")
        self.assertEqual(response.json()[0]["location"], "Fallback location")
