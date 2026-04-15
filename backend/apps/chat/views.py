from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.permissions import ProjectMemberPermission, get_user_project
from apps.rag.graph import run_research_graph

from .models import ChatMessage
from .serializers import ChatMessageSerializer


class ChatView(APIView):
    permission_classes = (permissions.IsAuthenticated, ProjectMemberPermission)

    def post(self, request, project_id):
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response(
                {"detail": "message is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = get_user_project(request.user, project_id)
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        result = run_research_graph(
            project_id=str(project.id),
            user_id=request.user.id,
            query=message,
        )
        return Response(
            {
                "answer": result.get("final_answer", ""),
                "citations": result.get("citations", []),
                "message_id": result.get("assistant_message_id"),
                "error": result.get("error"),
            },
            status=status.HTTP_200_OK,
        )


class ChatMessageListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, ProjectMemberPermission)
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        return ChatMessage.objects.filter(project_id=self.kwargs["project_id"])
