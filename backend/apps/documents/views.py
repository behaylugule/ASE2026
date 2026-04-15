from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser

from apps.projects.permissions import ProjectMemberPermission, get_user_project

from .models import Document
from .serializers import DocumentCreateSerializer, DocumentSerializer
from .tasks import ingest_document


class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated, ProjectMemberPermission)
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentCreateSerializer
        return DocumentSerializer

    def get_project(self):
        return get_user_project(self.request.user, self.kwargs["project_id"])

    def get_queryset(self):
        return Document.objects.filter(project_id=self.kwargs["project_id"])

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["project"] = self.get_project()
        return ctx

    def perform_create(self, serializer):
        serializer.save()
        doc = serializer.instance
        ingest_document.delay(str(doc.id))


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, ProjectMemberPermission)
    serializer_class = DocumentSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return Document.objects.filter(project_id=self.kwargs["project_id"])
