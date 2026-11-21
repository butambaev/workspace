from rest_framework.permissions import BasePermission


def can_manage(user, project):
    """Админ — везде; менеджер — только в своих проектах."""
    return user.role == 'admin' or (user.role == 'manager' and project.owner_id == user.id)


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'manager')


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
