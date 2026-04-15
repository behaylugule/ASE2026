from rest_framework import permissions

from apps.projects.models import Project


def get_user_project(user, project_id):
    return Project.objects.filter(pk=project_id, owner=user).first()


class ProjectMemberPermission(permissions.BasePermission):
    """Requires authenticated user and ownership of project_id from URL."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        project_id = view.kwargs.get("project_id")
        if not project_id:
            return False
        return get_user_project(request.user, project_id) is not None
