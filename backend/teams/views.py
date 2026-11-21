from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsAdmin
from accounts.serializers import UserSerializer

User = get_user_model()


def visible_users(user):
    """Админ и менеджер видят всех (чтобы приглашать в проекты); участник — коллег по проектам."""
    if user.role in ('admin', 'manager'):
        return User.objects.all()
    return User.objects.filter(projects_in__in=user.projects_in.all()).distinct()


class TeamView(APIView):
    def get(self, request):
        data = []
        for u in visible_users(request.user).order_by('username'):
            d = UserSerializer(u).data
            d['projects'] = [{'id': p.id, 'name': p.name} for p in u.projects_in.filter(members=request.user)] \
                if request.user.role != 'admin' else [{'id': p.id, 'name': p.name} for p in u.projects_in.all()]
            data.append(d)
        return Response(data)


class UserRoleView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        u = User.objects.filter(pk=pk).first()
        if not u:
            raise ValidationError('Пользователь не найден')
        if u.id == request.user.id:
            raise ValidationError('Нельзя менять собственную роль')
        role = request.data.get('role')
        if role not in ('admin', 'manager', 'member'):
            raise ValidationError({'role': 'Допустимо: admin, manager, member'})
        u.role = role
        u.save()
        return Response(UserSerializer(u).data)
