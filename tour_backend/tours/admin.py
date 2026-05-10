from django.contrib import admin
from django.contrib.auth.hashers import identify_hasher, make_password

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
    list_display = ("id", "title", "price", "currency", "location", "difficulty", "max_people", "created_at")
    search_fields = ("title", "location", "currency")
    list_filter = ("difficulty",)


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
