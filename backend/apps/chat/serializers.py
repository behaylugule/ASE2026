from rest_framework import serializers

from apps.chat.models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "role", "content", "citations", "created_at")
        read_only_fields = ("id", "role", "content", "citations", "created_at")
