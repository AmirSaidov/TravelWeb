from django.urls import path
<<<<<<< HEAD
from .views import ai_chat

urlpatterns = [
    path("chat/", ai_chat),
=======

from .views import (
    AIConversationDetailView,
    AIConversationListCreateView,
    AIConversationMessageView,
    ai_chat,
    translate_text,
)

urlpatterns = [
    path("chat/", ai_chat),
    path("translate/", translate_text),
    path("conversations/", AIConversationListCreateView.as_view()),
    path("conversations/<int:conversation_id>/", AIConversationDetailView.as_view()),
    path("conversations/<int:conversation_id>/message/", AIConversationMessageView.as_view()),
>>>>>>> 4b89e51544d3586b6d3857413771ba70b9d4b92a
]
