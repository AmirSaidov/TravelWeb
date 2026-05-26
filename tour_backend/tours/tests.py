from django.test import RequestFactory, SimpleTestCase, override_settings

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
