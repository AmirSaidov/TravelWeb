from django.db import transaction
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Avg, Count
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from datetime import timedelta

from .models import Booking, Payment, Review, User, Tour
from .services import booking_service

from .serializers import ReviewSerializer, TourSerializer, get_tour_image_url
from .auth import create_access_token
from .currency import convert_money, get_currency_config, normalize_currency, quantize_money

PAYMENT_HOLD_HOURS = 24


def _payment_due_at(booking):
    if not getattr(booking, "created_at", None):
        return None
    return booking.created_at + timedelta(hours=PAYMENT_HOLD_HOURS)


def _is_payment_expired(booking):
    if booking.status != Booking.Status.PENDING:
        return False
    due_at = _payment_due_at(booking)
    if due_at is None:
        return False
    return timezone.now() > due_at

def get_request_user(request):
    request_user = getattr(request, "user", None)
    if request_user and getattr(request_user, "id", None):
        return request_user
    return None


def _requested_currency(request) -> str:
    return normalize_currency(getattr(request, "query_params", {}).get("currency"))


def _tour_currency(tour: Tour) -> str:
    return normalize_currency(getattr(tour, "currency", "")) or "KGS"


def _convert_amount(amount, from_currency: str, request) -> tuple[str, str]:
    """
    Returns (amount_str, currency_code) for the requested currency (if known),
    otherwise returns original amount/currency.
    """
    req_cur = _requested_currency(request)
    src_cur = normalize_currency(from_currency) or "KGS"
    if req_cur:
        cfg = get_currency_config()
        if cfg.rate_to_base(req_cur) is None:
            req_cur = ""
    if req_cur and req_cur != src_cur:
        out = convert_money(amount, from_currency=src_cur, to_currency=req_cur)
        return str(quantize_money(out)), req_cur
    return str(quantize_money(amount)), src_cur


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not name:
            return Response({"error": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"error": "email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 6:
            return Response({"error": "password must be at least 6 chars."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "email already registered."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(name=name, email=email, password=make_password(password))
        token = create_access_token(user=user)
        return Response(
            {
                "token": token,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response({"error": "email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        token = create_access_token(user=user)
        return Response(
            {
                "token": token,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
                },
            }
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_request_user(request)
        return Response(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
            }
        )

    def patch(self, request):
        user = get_request_user(request)
        name = request.data.get("name")
        password = request.data.get("password")

        if isinstance(name, str) and name.strip():
            user.name = name.strip()
        if isinstance(password, str) and password:
            if len(password) < 6:
                return Response({"error": "password must be at least 6 chars."}, status=status.HTTP_400_BAD_REQUEST)
            user.password = make_password(password)

        user.save()
        return Response(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
            }
        )


class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tour_id = request.data.get('tour_id')
        people_count = request.data.get('people_count')
        date = request.data.get("date")
        user = get_request_user(request)

        (
            booking,
            total_price,
            available_places_after_booking,
        ) = booking_service.create_booking(
            user=user,
            tour_id=tour_id,
            people_count=people_count,
            date=date,
        )

        total_price_str, out_currency = _convert_amount(total_price, from_currency=_tour_currency(booking.tour), request=request)
        return Response(
            {
                'booking_id': booking.id,
                'status': booking.status,
                'total_price': total_price_str,
                'currency': out_currency,
                'available_places': available_places_after_booking,
                'payment_due_at': _payment_due_at(booking).isoformat() if _payment_due_at(booking) else None,
            },
            status=status.HTTP_201_CREATED,
        )


class BookingConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        with transaction.atomic():
            try:
                booking = Booking.objects.select_for_update().get(id=id)
            except Booking.DoesNotExist:
                return Response(
                    {'error': 'Booking not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if booking.status == 'confirmed':
                return Response(
                    {'error': 'Booking is already confirmed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if _is_payment_expired(booking):
                booking.status = Booking.Status.CANCELLED
                booking.save(update_fields=["status"])
                return Response(
                    {"error": "Payment window expired. Booking was cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if booking.status == Booking.Status.CANCELLED:
                return Response(
                    {"error": "Booking is cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = get_request_user(request)
            if user is not None and booking.user_id != getattr(user, 'id', None):
                return Response(
                    {'error': 'You cannot confirm this booking.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            booking.status = 'confirmed'
            booking.save()

        return Response(
            {
                'booking_id': booking.id,
                'status': booking.status,
            }
        )


class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_request_user(request)
        bookings = (
            Booking.objects.filter(user=user)
            .select_related("tour")
            .order_by("-id")
        )

        data = []
        for b in bookings:
            if _is_payment_expired(b):
                b.status = Booking.Status.CANCELLED
                b.save(update_fields=["status"])

            due_at = _payment_due_at(b)
            price_str, price_currency = _convert_amount(b.tour.price, from_currency=_tour_currency(b.tour), request=request)
            data.append(
                {
                    "id": b.id,
                    "status": b.status,
                    "people_count": b.people_count,
                    "date": b.date.isoformat() if b.date else None,
                    "created_at": b.created_at.isoformat() if getattr(b, "created_at", None) else None,
                    "payment_due_at": due_at.isoformat() if due_at else None,
                    "payment_expired": bool(due_at and timezone.now() > due_at),
                    "tour": {
                        "id": b.tour.id,
                        "title": b.tour.title,
                        "price": price_str,
                        "currency": price_currency,
                        "location": b.tour.location,
                        "duration": b.tour.duration,
                        "image": get_tour_image_url(b.tour, request),
                    },
                }
            )

        return Response(data)


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        user = get_request_user(request)
        try:
            booking = Booking.objects.get(id=id, user=user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.status == Booking.Status.CONFIRMED:
            return Response({"error": "Confirmed booking cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"error": "Booking already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        return Response({"booking_id": booking.id, "status": booking.status})


class PaymentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        user = get_request_user(request)

        try:
            booking_id = int(booking_id)
        except (TypeError, ValueError):
            return Response({"error": "booking_id must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.select_related("tour").get(id=booking_id, user=user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.status == Booking.Status.CANCELLED:
            return Response({"error": "Cannot pay for cancelled booking."}, status=status.HTTP_400_BAD_REQUEST)
        if booking.status == Booking.Status.CONFIRMED:
            return Response({"error": "Booking already confirmed."}, status=status.HTTP_400_BAD_REQUEST)
        if _is_payment_expired(booking):
            booking.status = Booking.Status.CANCELLED
            booking.save(update_fields=["status"])
            return Response({"error": "Payment window expired. Booking was cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        amount = booking.tour.price * booking.people_count
        with transaction.atomic():
            payment = Payment.objects.create(
                booking=booking,
                amount=amount,
                status=Payment.Status.SUCCESS,
            )
            booking.status = Booking.Status.CONFIRMED
            booking.save(update_fields=["status"])

        amount_str, out_currency = _convert_amount(payment.amount, from_currency=_tour_currency(booking.tour), request=request)
        return Response(
            {
                "payment_id": payment.id,
                "booking_id": booking.id,
                "payment_status": payment.status,
                "booking_status": booking.status,
                "amount": amount_str,
                "currency": out_currency,
            },
            status=status.HTTP_201_CREATED,
        )


class ReviewsByTourView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, tour_id):
        reviews = (
            Review.objects.filter(tour_id=tour_id)
            .select_related("user")
            .order_by("-created_at", "-id")
        )
        data = []
        for r in reviews:
            data.append(
                {
                    "id": r.id,
                    "tour_id": r.tour_id,
                    "rating": r.rating,
                    "comment": r.comment,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "user": {"id": r.user_id, "name": r.user.name},
                }
            )
        return Response(data)


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = get_request_user(request)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tour_id = serializer.validated_data["tour"].id
        if not Tour.objects.filter(id=tour_id).exists():
            return Response({"error": "Tour not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only allow reviews from users who have a confirmed booking for the tour.
        has_confirmed_booking = Booking.objects.filter(
            user=user, tour_id=tour_id, status=Booking.Status.CONFIRMED
        ).exists()
        if not has_confirmed_booking:
            return Response(
                {"error": "You can only review tours you have booked."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent duplicate reviews per user/tour.
        if Review.objects.filter(user=user, tour_id=tour_id).exists():
            return Response(
                {"error": "You have already reviewed this tour."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review.objects.create(
            user=user,
            tour_id=tour_id,
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data["comment"],
        )
        return Response(
            {
                "id": review.id,
                "tour_id": review.tour_id,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at.isoformat() if review.created_at else None,
            },
            status=status.HTTP_201_CREATED,
        )
class TourListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tours = Tour.objects.annotate(
            rating_avg=Coalesce(Avg("review__rating"), 0.0),
            review_count=Coalesce(Count("review"), 0),
        )

        location = request.query_params.get('location')
        difficulty = request.query_params.get('difficulty')
        price_min = request.query_params.get('price_min')
        price_max = request.query_params.get('price_max')

        if location:
            tours = tours.filter(location=location)
        if difficulty:
            tours = tours.filter(difficulty=difficulty)
        if price_min:
            tours = tours.filter(price__gte=float(price_min))
        if price_max:
            tours = tours.filter(price__lte=float(price_max))

        page_str = request.query_params.get('page')
        limit_str = request.query_params.get('limit')

        if page_str or limit_str:
            try:
                page = int(page_str) if page_str else 1
                limit = int(limit_str) if limit_str else 10
                if page < 1:
                    page = 1
                if limit < 1:
                    limit = 10
                skip = (page - 1) * limit
                tours = tours[skip: skip + limit]
            except ValueError:
                pass

        serializer = TourSerializer(tours, many=True, context={"request": request})
        return Response(serializer.data)


class TourDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, tour_id):
        try:
            tour = Tour.objects.annotate(
                rating_avg=Coalesce(Avg("review__rating"), 0.0),
                review_count=Coalesce(Count("review"), 0),
            ).get(id=tour_id)
        except Tour.DoesNotExist:
            return Response(
                {'detail': 'Тур не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = TourSerializer(tour, context={"request": request})
        return Response(serializer.data)


class CurrencyRatesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cfg = get_currency_config()
        return Response(
            {
                "base": cfg.base,
                "rates_to_base": {k: str(v) for k, v in sorted(cfg.rates_to_base.items())},
            }
        )
