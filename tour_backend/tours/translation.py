from modeltranslation.translator import TranslationOptions, register

from .models import Tour


@register(Tour)
class TourTranslationOptions(TranslationOptions):
    fields = ("title", "description")
