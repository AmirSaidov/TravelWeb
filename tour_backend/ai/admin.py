from django.contrib import admin

from .models import AIConversation, AIMessage


class AIMessageInline(admin.TabularInline):
    model = AIMessage
    extra = 0
    readonly_fields = ("role", "content", "cards", "created_at")
    can_delete = False


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_id", "title", "created_at", "updated_at")
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "session_id", "user__email", "user__name")
    readonly_fields = ("created_at", "updated_at")
    inlines = [AIMessageInline]


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("content", "conversation__title")
    readonly_fields = ("created_at",)
