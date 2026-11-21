from django.utils import timezone
from rest_framework import serializers
from .models import Comment, Task


def _name(u):
    return (u.get_full_name() or u.username) if u else None


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignee_name = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'project', 'project_name', 'assignee', 'assignee_name', 'creator',
                  'creator_name', 'priority', 'status', 'deadline', 'created_at', 'comments_count', 'is_overdue']
        read_only_fields = ['id', 'creator', 'created_at']

    def get_assignee_name(self, o):
        return _name(o.assignee)

    def get_creator_name(self, o):
        return _name(o.creator)

    def get_comments_count(self, o):
        return o.comments.count()

    def get_is_overdue(self, o):
        return bool(o.deadline and o.status != 'done' and o.deadline < timezone.localdate())

    def validate(self, attrs):
        from projects.views import visible_projects
        user = self.context['request'].user
        if self.instance and 'project' in attrs and attrs['project'] != self.instance.project:
            raise serializers.ValidationError({'project': 'Нельзя перенести задачу в другой проект'})
        project = attrs.get('project') or (self.instance.project if self.instance else None)
        if not visible_projects(user).filter(pk=project.pk).exists():
            raise serializers.ValidationError({'project': 'Нет доступа к проекту'})
        a = attrs.get('assignee')
        if a and not project.members.filter(pk=a.pk).exists():
            raise serializers.ValidationError({'assignee': 'Исполнитель должен быть участником проекта'})
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_name', 'author_avatar', 'text', 'created_at']
        read_only_fields = ['id', 'task', 'author', 'created_at']

    def get_author_name(self, o):
        return _name(o.author)
