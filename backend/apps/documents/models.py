import uuid

from django.db import models

from apps.projects.models import Project


class DocumentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    READY = "ready", "Ready"
    FAILED = "failed", "Failed"


def document_upload_path(instance, filename):
    return f"projects/{instance.project_id}/documents/{instance.id}/{filename}"


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    original_filename = models.CharField(max_length=512)
    file = models.FileField(upload_to=document_upload_path, max_length=500)
    mime_type = models.CharField(max_length=128, blank=True)
    status = models.CharField(
        max_length=32,
        choices=DocumentStatus.choices,
        default=DocumentStatus.PENDING,
    )
    error_message = models.TextField(blank=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
