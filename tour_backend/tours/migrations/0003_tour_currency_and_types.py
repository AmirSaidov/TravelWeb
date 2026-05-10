from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0002_timestamps_booking_date_and_statuses"),
    ]

    operations = [
        migrations.AddField(
            model_name="tour",
            name="currency",
            field=models.CharField(blank=True, default="", max_length=8),
        ),
        migrations.AddField(
            model_name="tour",
            name="types",
            field=models.JSONField(blank=True, default=list),
        ),
    ]

