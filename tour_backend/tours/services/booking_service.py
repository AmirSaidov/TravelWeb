from decimal import Decimal
from datetime import date as date_type
from datetime import timedelta

from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from tours.models import Booking, Tour

PAYMENT_HOLD_HOURS = 24


def _parse_date(value):
    if value in (None, "", 0):
        return None
    if isinstance(value, date_type):
        return value
    if isinstance(value, str):
        try:
            return date_type.fromisoformat(value)
        except ValueError as exc:
            raise ValidationError({'error': 'date must be in YYYY-MM-DD format.'}) from exc
    raise ValidationError({'error': 'date must be a string in YYYY-MM-DD format.'})


def create_booking(user, tour_id, people_count, date=None):
    try:
        tour_id = int(tour_id)
    except (TypeError, ValueError):
        raise ValidationError({'error': 'tour_id must be a valid integer.'})

    try:
        people_count = int(people_count)
    except (TypeError, ValueError):
        raise ValidationError(
            {'error': 'people_count must be a positive integer.'}
        )

    if people_count <= 0:
        raise ValidationError(
            {'error': 'people_count must be greater than 0.'}
        )

    if user is None:
        raise ValidationError({'error': 'User is required.'})

    booking_date = _parse_date(date)
    today = date_type.today()

    with transaction.atomic():
        try:
            tour = Tour.objects.select_for_update().get(id=tour_id)
        except Tour.DoesNotExist:
            raise ValidationError({'error': 'Tour not found.'})

        # Prevent duplicate booking for the same tour instance:
        # - if an existing booking is pending/confirmed AND not in the past, block
        # - if an existing booking is cancelled (declined), allow retry
        # - if an existing booking's date is in the past, allow booking again (future run)
        pending_fresh_from = timezone.now() - timedelta(hours=PAYMENT_HOLD_HOURS)
        has_active_booking = Booking.objects.filter(
            user=user,
            tour=tour,
        ).filter(
            (
                Q(status=Booking.Status.CONFIRMED)
                & (Q(date__isnull=True) | Q(date__gte=today))
            )
            |
            (
                Q(status=Booking.Status.PENDING)
                & Q(created_at__gte=pending_fresh_from)
                & (Q(date__isnull=True) | Q(date__gte=today))
            )
        ).exists()
        if has_active_booking:
            raise ValidationError({'error': 'You already have an active booking for this tour.'})

        booked_people = (
            Booking.objects.filter(
                tour=tour,
                status__in=['pending', 'confirmed'],
            ).aggregate(total=Sum('people_count'))['total']
            or 0
        )
        available_places = tour.max_people - booked_people

        if tour.max_people <= 0:
            raise ValidationError(
                {'error': 'Tour has no available capacity configured.'}
            )

        if people_count > available_places:
            raise ValidationError(
                {'error': 'Not enough available places.'}
            )

        total_price = tour.price * Decimal(people_count)
        available_places_after_booking = available_places - people_count
        booking = Booking.objects.create(
            user=user,
            tour=tour,
            date=booking_date,
            people_count=people_count,
            status='pending',
        )

    return booking, total_price, available_places_after_booking
