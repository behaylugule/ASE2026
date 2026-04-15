import uuid

import django.db.models.deletion
from django.db import migrations, models
from pgvector.django import VectorField


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("documents", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS vector;",
            reverse_sql="DROP EXTENSION IF EXISTS vector;",
        ),
        migrations.CreateModel(
            name="DocumentChunk",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("chunk_index", models.PositiveIntegerField()),
                ("content", models.TextField()),
                ("token_count", models.PositiveIntegerField(default=0)),
                ("page_number", models.PositiveIntegerField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("embedding", VectorField(dimensions=384)),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chunks",
                        to="documents.document",
                    ),
                ),
            ],
            options={
                "ordering": ["document_id", "chunk_index"],
            },
        ),
        migrations.AddConstraint(
            model_name="documentchunk",
            constraint=models.UniqueConstraint(
                fields=("document", "chunk_index"),
                name="uniq_document_chunk_index",
            ),
        ),
    ]
