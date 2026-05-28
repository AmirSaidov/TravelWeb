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
    AUTO_TRANSLATED_FIELDS = ("title", "description")
    AUTO_TRANSLATION_LANGUAGES = ("en", "ky")
    SOURCE_LANGUAGE = "ru"

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, blank=True, default="")
    location = models.CharField(max_length=255)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    duration = models.IntegerField(help_text="Duration in days")
    difficulty = models.CharField(max_length=50)
    types = models.JSONField(default=list, blank=True)
    max_people = models.IntegerField()
    image = models.ImageField(upload_to="tours/", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def _has_model_field(self, field_name):
        return any(field.name == field_name for field in self._meta.fields)

    def _raw_field_value(self, field_name):
        value = self.__dict__.get(field_name)
        if value:
            return value
        return getattr(self, field_name, "") or ""

    def _source_field_name(self, field_name):
        translated_name = f"{field_name}_{self.SOURCE_LANGUAGE}"
        return translated_name if self._has_model_field(translated_name) else field_name

    def _source_value(self, field_name):
        translated_name = f"{field_name}_{self.SOURCE_LANGUAGE}"
        if self._has_model_field(translated_name):
            value = getattr(self, translated_name, "") or ""
            if value:
                return value
        return self._raw_field_value(field_name)

    def _old_source_value(self, field_name):
        if not self.pk:
            return ""

        source_field = self._source_field_name(field_name)
        try:
            old_obj = type(self).objects.only(field_name, source_field).get(pk=self.pk)
        except type(self).DoesNotExist:
            return ""
        return old_obj._source_value(field_name)

    def _populate_translation_fields(self):
        from .translation_service import auto_translate_text

        changed_fields = set()
        for field_name in self.AUTO_TRANSLATED_FIELDS:
            source_text = str(self._source_value(field_name) or "").strip()
            if not source_text:
                continue

            source_field = self._source_field_name(field_name)
            if self._has_model_field(source_field) and getattr(self, source_field, "") != source_text:
                setattr(self, source_field, source_text)
                changed_fields.add(source_field)

            if self._has_model_field(field_name) and self.__dict__.get(field_name) != source_text:
                self.__dict__[field_name] = source_text
                changed_fields.add(field_name)

            old_source = self._old_source_value(field_name)
            source_changed = bool(self.pk and old_source and old_source != source_text)

            for language in self.AUTO_TRANSLATION_LANGUAGES:
                translated_field = f"{field_name}_{language}"
                if not self._has_model_field(translated_field):
                    continue

                current_value = str(getattr(self, translated_field, "") or "").strip()
                if current_value and not source_changed:
                    continue

                translated_text = auto_translate_text(source_text, language)
                setattr(self, translated_field, translated_text)
                changed_fields.add(translated_field)

        return changed_fields

    def save(self, *args, **kwargs):
        changed_fields = self._populate_translation_fields()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | changed_fields
        super().save(*args, **kwargs)

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
