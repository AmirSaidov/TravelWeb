from django.urls import path

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
]