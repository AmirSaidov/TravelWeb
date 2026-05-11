from django.contrib import admin
from django.contrib.auth.hashers import identify_hasher, make_password
from django.utils.safestring import mark_safe

from .models import Booking, Payment, Review, Tour, User


def _looks_hashed(password: str) -> bool:
    try:
        identify_hasher(password)
        return True
    except Exception:  # noqa: BLE001
        return False


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email")
    search_fields = ("name", "email")

    def save_model(self, request, obj, form, change):
        if obj.password and not _looks_hashed(obj.password):
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "price", "currency", "location", "lat", "lng", "difficulty", "max_people", "created_at")
    search_fields = ("title", "location", "currency")
    list_filter = ("difficulty",)
    readonly_fields = ("created_at",)
    fields = (
        "title",
        "description",
        "price",
        "currency",
        "location",
        "lat",
        "lng",
        "duration",
        "difficulty",
        "types",
        "max_people",
        "image",
        "created_at",
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "lat" in form.base_fields and "lng" in form.base_fields:
            form.base_fields["lat"].help_text = mark_safe(
                """
                Search a place (Kyrgyzstan) or click on the map to set coordinates.<br/>
                <div class="coord-picker__search">
                  <input id="coord-search" type="text" placeholder="Search place (e.g. Ala-Kul, Karakol)" />
                  <div id="coord-search-results" class="coord-picker__results" aria-label="Search results"></div>
                </div>
                <div id="coord-picker" style="height:320px;border-radius:12px;overflow:hidden;margin-top:8px;"></div>
                """
            )
            form.base_fields["lng"].help_text = "Filled automatically from the map (or enter manually)."
        return form

    class Media:
        css = {
            "all": (
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
                "tours/admin/coordPicker.css",
            )
        }
        js = (
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
            "tours/admin/coordPicker.js",
        )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tour", "people_count", "status", "date", "created_at")
    list_filter = ("status",)
    list_select_related = ("user", "tour")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "amount", "status", "created_at")
    list_filter = ("status",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tour", "rating", "created_at")
    list_filter = ("rating",)
    list_select_related = ("user", "tour")
