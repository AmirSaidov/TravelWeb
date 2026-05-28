from decimal import Decimal
from unittest.mock import patch

from django.db import models
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.utils.translation import override

from .models import Tour
from .serializers import TourSerializer, make_absolute_media_url


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


class TourDynamicTranslationTests(SimpleTestCase):
    def _tour(self):
        return Tour(
            title="Иссык-Куль тур",
            description="Описание тура",
            price=Decimal("3500.00"),
            currency="KGS",
            location="Иссык-Куль",
            duration=2,
            difficulty="Легкий",
            types=[],
            max_people=8,
            image="tours/test.jpg",
        )

    @patch("tours.translation_service.auto_translate_text")
    def test_tour_populates_translation_fields_from_russian_source(self, mocked_translate):
        mocked_translate.side_effect = lambda text, language: f"{language}:{text}"
        tour = self._tour()

        changed_fields = tour._populate_translation_fields()

        self.assertEqual(tour.title_ru, "Иссык-Куль тур")
        self.assertEqual(tour.title_en, "en:Иссык-Куль тур")
        self.assertEqual(tour.title_ky, "ky:Иссык-Куль тур")
        self.assertEqual(tour.description_ru, "Описание тура")
        self.assertEqual(tour.description_en, "en:Описание тура")
        self.assertEqual(tour.description_ky, "ky:Описание тура")
        self.assertIn("title_en", changed_fields)
        self.assertIn("description_ky", changed_fields)

    @patch.object(models.Model, "save")
    @patch.object(Tour, "_populate_translation_fields", return_value={"title_en", "description_en"})
    def test_tour_save_populates_translations_and_preserves_update_fields(self, mocked_populate, mocked_model_save):
        tour = self._tour()

        tour.save(update_fields={"title_ru"})

        mocked_populate.assert_called_once()
        mocked_model_save.assert_called_once()
        self.assertEqual(
            mocked_model_save.call_args.kwargs["update_fields"],
            {"title_ru", "title_en", "description_en"},
        )

    def test_serializer_returns_active_language_without_exposing_all_language_fields(self):
        tour = self._tour()
        tour.title_ru = "Иссык-Куль тур"
        tour.title_en = "Issyk-Kul tour"
        tour.title_ky = "Ысык-Көл туру"
        tour.description_ru = "Описание тура"
        tour.description_en = "Tour description"
        tour.description_ky = "Турдун сүрөттөмөсү"

        with override("ky"):
            data = TourSerializer(tour).data

        self.assertEqual(data["title"], "Ысык-Көл туру")
        self.assertEqual(data["description"], "Турдун сүрөттөмөсү")
        self.assertNotIn("title_ru", data)
        self.assertNotIn("title_en", data)
        self.assertNotIn("title_ky", data)

    def test_serializer_falls_back_to_russian_when_translation_is_empty(self):
        tour = self._tour()
        tour.title_ru = "Иссык-Куль тур"
        tour.description_ru = "Описание тура"
        tour.title_en = ""
        tour.description_en = ""

        with override("en"):
            data = TourSerializer(tour).data

        self.assertEqual(data["title"], "Иссык-Куль тур")
        self.assertEqual(data["description"], "Описание тура")
