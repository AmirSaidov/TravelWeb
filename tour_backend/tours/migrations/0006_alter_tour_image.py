from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0005_tour_lat_lng"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tour",
            name="image",
            field=models.ImageField(max_length=500, upload_to="tours/"),
        ),
    ]
