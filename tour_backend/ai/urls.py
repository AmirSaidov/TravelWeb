from django.urls import path
from .views import ai_chat, translate_text

urlpatterns = [
    path("chat/", ai_chat),
    path("translate/", translate_text),
]
