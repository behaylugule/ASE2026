from django.contrib import admin

from .models import DocumentChunk


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "chunk_index", "page_number")
    raw_id_fields = ("document",)
