from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = (
            "id",
            "original_filename",
            "file",
            "mime_type",
            "status",
            "error_message",
            "page_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "mime_type",
            "status",
            "error_message",
            "page_count",
            "created_at",
            "updated_at",
        )


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("file",)

    def validate_file(self, value):
        name = value.name.lower()
        if not (name.endswith(".pdf") or name.endswith(".docx")):
            raise serializers.ValidationError("Only PDF and DOCX files are allowed.")
        return value

    def create(self, validated_data):
        upload = validated_data["file"]
        project = self.context["project"]
        doc = Document.objects.create(
            project=project,
            original_filename=upload.name,
            file=upload,
            mime_type=getattr(upload, "content_type", "") or "",
        )
        return doc
