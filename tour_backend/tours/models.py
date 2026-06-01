from django.db import models

class User(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.name


class Tour(models.Model):
    title = models.CharField(max_length=255)
    title_ru = models.CharField(max_length=255, blank=True, default="")
    title_en = models.CharField(max_length=255, blank=True, default="")
    title_ky = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField()
    description_ru = models.TextField(blank=True, default="")
    description_en = models.TextField(blank=True, default="")
    description_ky = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, blank=True, default="")
    location = models.CharField(max_length=255)
    location_ru = models.CharField(max_length=255, blank=True, default="")
    location_en = models.CharField(max_length=255, blank=True, default="")
    location_ky = models.CharField(max_length=255, blank=True, default="")
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    duration = models.IntegerField(help_text="Duration in days")
    difficulty = models.CharField(max_length=50)
    types = models.JSONField(default=list, blank=True)
    max_people = models.IntegerField()
    image = models.ImageField(upload_to="tours/", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    gallery = models.JSONField(default=list, blank=True)
    itinerary = models.JSONField(default=list, blank=True)
    included = models.JSONField(default=list, blank=True)
    excluded = models.JSONField(default=list, blank=True)
    equipment = models.JSONField(default=list, blank=True)
    accommodation = models.TextField(blank=True, default='')
    guide_name = models.CharField(max_length=255, blank=True, default='')
    guide_bio = models.TextField(blank=True, default='')

    def __str__(self):
        return self.title


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE)
    date = models.DateField(null=True, blank=True)
    people_count = models.IntegerField()
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.tour}"



class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.id}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.tour}"


class TourDate(models.Model):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name='dates')
    start_date = models.DateField()
    end_date = models.DateField()
    available_spots = models.IntegerField()

    def __str__(self):
        return f"{self.tour.title} — {self.start_date}"
