from django.urls import path
from .views import (
    BookingCancelView,
    BookingConfirmView,
    BookingListCreateView,
    LoginView,
    MyBookingsView,
    PaymentCreateView,
    ProfileView,
    RegisterView,
    ReviewCreateView,
    ReviewsByTourView,
    TourListView,
    TourDetailView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),

    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/my/', MyBookingsView.as_view(), name='my-bookings'),
    path('bookings/<int:id>/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('bookings/<int:id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('payments/', PaymentCreateView.as_view(), name='payment-create'),
    
    path('tours/', TourListView.as_view(), name='tour-list'),
    path('tours/<int:tour_id>/', TourDetailView.as_view(), name='tour-detail'),

    path("reviews/<int:tour_id>/", ReviewsByTourView.as_view(), name="reviews-by-tour"),
    path("reviews/", ReviewCreateView.as_view(), name="review-create"),
]
