from django.urls import path

from apps.chat.views import ChatMessageListView, ChatView
from apps.documents.views import DocumentDetailView, DocumentListCreateView

from .views import ProjectDetailView, ProjectListCreateView

urlpatterns = [
    path("projects/", ProjectListCreateView.as_view(), name="project-list"),
    path("projects/<uuid:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path(
        "projects/<uuid:project_id>/documents/",
        DocumentListCreateView.as_view(),
        name="document-list",
    ),
    path(
        "projects/<uuid:project_id>/documents/<uuid:pk>/",
        DocumentDetailView.as_view(),
        name="document-detail",
    ),
    path(
        "projects/<uuid:project_id>/chat/",
        ChatView.as_view(),
        name="project-chat",
    ),
    path(
        "projects/<uuid:project_id>/chat/messages/",
        ChatMessageListView.as_view(),
        name="chat-messages",
    ),
]
