from urllib.parse import urljoin

from django.conf import settings
from rest_framework import serializers

from .models import Review, Tour, Stay
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


class StaySerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    region = serializers.SerializerMethodField()
    hero = serializers.SerializerMethodField()
    reviewCount = serializers.IntegerField(source="review_count")
    pricePerNight = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    maxGuests = serializers.IntegerField(source="max_guests")

    def _requested_language(self) -> str:
        req = self.context.get("request") if isinstance(self.context, dict) else None
        if not req:
            return ""
        query_params = getattr(req, "query_params", None) or getattr(req, "GET", None)
        if not query_params:
            return ""
        lang = str(query_params.get("lang") or "").strip().lower().split("-")[0]
        return lang if lang in {"ru", "en", "ky"} else ""

    def _localized_value(self, obj, field_name: str) -> str:
        lang = self._requested_language()
        fallback = getattr(obj, field_name, "") or ""
        if not lang:
            return str(fallback)

        translated = getattr(obj, f"{field_name}_{lang}", "") or ""
        return str(translated or fallback)

    def get_title(self, obj) -> str:
        return self._localized_value(obj, "title")

    def get_location(self, obj) -> str:
        return self._localized_value(obj, "location")

    def get_region(self, obj) -> str:
        return self._localized_value(obj, "region")

    def get_hero(self, obj) -> str:
        image = getattr(obj, "image", None)
        if not image:
            return ""
        raw = str(image)
        if raw.startswith(("http://", "https://", "//", "data:")):
            return raw
        try:
            url = image.url
        except (AttributeError, ValueError):
            return raw
        req = self.context.get("request") if isinstance(self.context, dict) else None
        return make_absolute_media_url(url, req)

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

    def get_currency(self, obj) -> str:
        requested = self._requested_currency()
        stored = normalize_currency(getattr(obj, "currency", "")) or "USD"
        return requested or stored

    def get_pricePerNight(self, obj) -> str:
        requested = self._requested_currency()
        stored_cur = normalize_currency(getattr(obj, "currency", "")) or "USD"
        amount = obj.price_per_night
        if requested and normalize_currency(requested) != stored_cur:
            amount = convert_money(amount, from_currency=stored_cur, to_currency=requested)
        return str(quantize_money(amount))

    class Meta:
        model = Stay
        fields = [
            "id",
            "slug",
            "title",
            "location",
            "region",
            "hero",
            "badge",
            "rating",
            "reviewCount",
            "pricePerNight",
            "currency",
            "amenities",
            "type",
            "maxGuests",
        ]


class TourSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    rating_avg = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    stays = StaySerializer(many=True, read_only=True)

    def _requested_language(self) -> str:
        req = self.context.get("request") if isinstance(self.context, dict) else None
        if not req:
            return ""
        query_params = getattr(req, "query_params", None) or getattr(req, "GET", None)
        if not query_params:
            return ""
        lang = str(query_params.get("lang") or "").strip().lower().split("-")[0]
        return lang if lang in {"ru", "en", "ky"} else ""

    def _localized_value(self, obj: Tour, field_name: str) -> str:
        lang = self._requested_language()
        fallback = getattr(obj, field_name, "") or ""
        if not lang:
            return str(fallback)

        translated = getattr(obj, f"{field_name}_{lang}", "") or ""
        return str(translated or fallback)

    def get_title(self, obj: Tour) -> str:
        return self._localized_value(obj, "title")

    def get_description(self, obj: Tour) -> str:
        return self._localized_value(obj, "description")

    def get_location(self, obj: Tour) -> str:
        return self._localized_value(obj, "location")
    
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
            'gallery',
            'itinerary',
            'included',
            'excluded',
            'equipment',
            'accommodation',
            'guide_name',
            'guide_bio',
            'stays',
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
