from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsManagerOrAdmin, can_manage
from notifications.services import notify
from tasks.models import Task
from .models import Activity, Project
from .serializers import ActivitySerializer, ProjectSerializer

User = get_user_model()


def visible_projects(user):
    """Пользователь видит только проекты, где он участник (админ — все)."""
    qs = Project.objects.all() if user.role == 'admin' else Project.objects.filter(members=user)
    return qs.distinct()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filterset_fields = ['status', 'priority']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'end_date']

    def get_queryset(self):
        return visible_projects(self.request.user).select_related('owner').prefetch_related('members')

    def get_permissions(self):
        perms = super().get_permissions()
        if self.action == 'create':
            perms.append(IsManagerOrAdmin())
        return perms

    def check_manage(self, project):
        if not can_manage(self.request.user, project):
            raise PermissionDenied('Недостаточно прав для управления этим проектом')

    def perform_create(self, serializer):
        p = serializer.save(owner=self.request.user)
        p.members.add(self.request.user)
        Activity.log(p, self.request.user, f'создал проект «{p.name}»')

    def perform_update(self, serializer):
        self.check_manage(serializer.instance)
        p = serializer.save()
        Activity.log(p, self.request.user, f'обновил проект «{p.name}»')

    def perform_destroy(self, instance):
        self.check_manage(instance)
        instance.delete()

    @action(detail=True, methods=['post'], url_path='members')
    def add_member(self, request, pk=None):
        p = self.get_object()
        self.check_manage(p)
        try:
            u = User.objects.get(pk=request.data.get('user_id'))
        except (User.DoesNotExist, ValueError, TypeError):
            raise ValidationError({'user_id': 'Пользователь не найден'})
        if not p.members.filter(pk=u.pk).exists():
            p.members.add(u)
            notify(u, f'Вас добавили в проект «{p.name}»', f'/projects/{p.id}', actor=request.user)
            Activity.log(p, request.user, f'добавил участника {u.get_full_name() or u.username}')
        return Response(ProjectSerializer(p).data)

    @action(detail=True, methods=['delete'], url_path=r'members/(?P<user_id>\d+)')
    def remove_member(self, request, pk=None, user_id=None):
        p = self.get_object()
        self.check_manage(p)
        if int(user_id) == p.owner_id:
            raise ValidationError('Нельзя удалить владельца проекта')
        p.members.remove(int(user_id))
        Task.objects.filter(project=p, assignee_id=user_id).update(assignee=None)
        Activity.log(p, request.user, 'удалил участника из проекта')
        return Response(ProjectSerializer(p).data)


class DashboardView(APIView):
    def get(self, request):
        projects = visible_projects(request.user)
        tasks = Task.objects.filter(project__in=projects)
        today = timezone.localdate()
        days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        chart = [{'date': d.strftime('%d.%m'), 'completed': tasks.filter(status='done', completed_at__date=d).count()} for d in days]
        return Response({
            'projects_total': projects.count(),
            'tasks_active': tasks.exclude(status='done').count(),
            'tasks_done': tasks.filter(status='done').count(),
            'tasks_overdue': tasks.filter(deadline__lt=today).exclude(status='done').count(),
            'recent_projects': ProjectSerializer(projects.order_by('-created_at')[:5], many=True).data,
            'activities': ActivitySerializer(Activity.objects.filter(project__in=projects).select_related('user', 'project')[:10], many=True).data,
            'chart': chart,
            'projects_progress': [{'id': p['id'], 'name': p['name'], 'progress': p['progress']}
                                  for p in ProjectSerializer(projects[:8], many=True).data],
        })
