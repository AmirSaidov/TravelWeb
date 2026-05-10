from rest_framework import serializers

from .models import Review, Tour


class TourSerializer(serializers.ModelSerializer):
    price = serializers.FloatField()
    rating_avg = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tour
        fields = [
            'id',
            'title',
            'description',
            'price',
            'currency',
            'location',
            'duration',
            'difficulty',
            'types',
            'max_people',
            'image',
            'rating_avg',
            'review_count',
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
