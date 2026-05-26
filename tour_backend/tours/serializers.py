from urllib.parse import urljoin

from django.conf import settings
from rest_framework import serializers

from .models import Review, Tour
from .currency import convert_money, get_currency_config, normalize_currency, quantize_money


def make_absolute_media_url(url: str, request=None) -> str:
    if not url:
        return ""
    if url.startswith(("http://", "https://", "//", "data:")):
        return url

    public_base_url = getattr(settings, "PUBLIC_BASE_URL", "")
    if public_base_url:
        return urljoin(f"{public_base_url}/", url.lstrip("/"))

    return request.build_absolute_uri(url) if request else url


def get_tour_image_url(tour: Tour, request=None) -> str:
    image = getattr(tour, "image", None)
    if not image:
        return ""

    raw = str(image)
    if raw.startswith(("http://", "https://", "//", "data:")):
        return raw

    try:
        url = image.url
    except (AttributeError, ValueError):
        return raw

    return make_absolute_media_url(url, request)


class TourSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    rating_avg = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    
    def _requested_currency(self) -> str:
        req = self.context.get("request") if isinstance(self.context, dict) else None
        if not req:
            return ""
        cur = req.query_params.get("currency")
        requested = normalize_currency(cur)
        if not requested:
            return ""
        cfg = get_currency_config()
        return requested if cfg.rate_to_base(requested) is not None else ""

    def get_currency(self, obj: Tour) -> str:
        requested = self._requested_currency()
        stored = normalize_currency(getattr(obj, "currency", "")) or "KGS"
        return requested or stored

    def get_price(self, obj: Tour) -> str:
        requested = self._requested_currency()
        stored_cur = normalize_currency(getattr(obj, "currency", "")) or "KGS"
        amount = obj.price  # DecimalField -> Decimal
        if requested and normalize_currency(requested) != stored_cur:
            amount = convert_money(amount, from_currency=stored_cur, to_currency=requested)
        return str(quantize_money(amount))

    def get_image(self, obj: Tour) -> str:
        req = self.context.get("request") if isinstance(self.context, dict) else None
        return get_tour_image_url(obj, req)

    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'description',
            'price',
            'currency',
            'location',
            'lat',
            'lng',
            'duration',
            'difficulty',
            'types',
            'max_people',
            'image',
            'rating_avg',
            'review_count',
        ]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "tour",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
