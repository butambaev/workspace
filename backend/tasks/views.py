import django_filters
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from accounts.permissions import can_manage
from notifications.services import notify
from projects.models import Activity
from projects.views import visible_projects
from .models import Task
from .serializers import CommentSerializer, TaskSerializer


class TaskFilter(django_filters.FilterSet):
    mine = django_filters.BooleanFilter(method='f_mine')
    overdue = django_filters.BooleanFilter(method='f_overdue')

    class Meta:
        model = Task
        fields = ['project', 'status', 'priority', 'assignee']

    def f_mine(self, qs, name, value):
        return qs.filter(assignee=self.request.user) if value else qs

    def f_overdue(self, qs, name, value):
        return qs.filter(deadline__lt=timezone.localdate()).exclude(status='done') if value else qs


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'title', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return (Task.objects.filter(project__in=visible_projects(self.request.user))
                .select_related('project', 'assignee', 'creator'))

    def perform_create(self, serializer):
        user = self.request.user
        project = serializer.validated_data['project']
        if not can_manage(user, project):
            raise PermissionDenied('Создавать задачи может администратор или менеджер проекта')
        t = serializer.save(creator=user, completed_at=timezone.now() if serializer.validated_data.get('status') == 'done' else None)
        Activity.log(project, user, f'создал задачу «{t.title}»')
        notify(t.assignee, f'Вам назначена задача «{t.title}»', f'/tasks?open={t.id}', actor=user)

    def perform_update(self, serializer):
        user = self.request.user
        task = serializer.instance
        manage = can_manage(user, task.project)
        if not manage:
            if task.assignee_id != user.id or set(self.request.data.keys()) - {'status'}:
                raise PermissionDenied('Исполнитель может менять только статус своей задачи')
        old_status, old_assignee = task.status, task.assignee_id
        extra = {}
        new_status = serializer.validated_data.get('status', old_status)
        if new_status != old_status:
            extra['completed_at'] = timezone.now() if new_status == 'done' else None
        t = serializer.save(**extra)
        if t.status != old_status:
            Activity.log(t.project, user, f'изменил статус задачи «{t.title}» → {t.get_status_display()}')
            notify(t.assignee, f'Статус задачи «{t.title}» изменён: {t.get_status_display()}', f'/tasks?open={t.id}', actor=user)
            notify(t.creator, f'Статус задачи «{t.title}» изменён: {t.get_status_display()}', f'/tasks?open={t.id}', actor=user)
        if t.assignee_id != old_assignee:
            notify(t.assignee, f'Вам назначена задача «{t.title}»', f'/tasks?open={t.id}', actor=user)

    def perform_destroy(self, instance):
        if not can_manage(self.request.user, instance.project):
            raise PermissionDenied('Недостаточно прав для удаления задачи')
        instance.delete()

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            return Response(CommentSerializer(task.comments.select_related('author'), many=True).data)
        s = CommentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        c = s.save(task=task, author=request.user)
        for u in {task.assignee, task.creator}:
            notify(u, f'Новый комментарий к задаче «{task.title}»', f'/tasks?open={task.id}', actor=request.user)
        return Response(CommentSerializer(c).data, status=201)
