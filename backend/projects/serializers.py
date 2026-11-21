from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Activity, Project


class ProjectSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    owner_name = serializers.SerializerMethodField()
    tasks_total = serializers.SerializerMethodField()
    tasks_done = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'priority', 'status', 'owner', 'owner_name',
                  'members', 'tasks_total', 'tasks_done', 'progress', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']

    def get_owner_name(self, o):
        return o.owner.get_full_name() or o.owner.username

    def get_tasks_total(self, o):
        return o.tasks.count()

    def get_tasks_done(self, o):
        return o.tasks.filter(status='done').count()

    def get_progress(self, o):
        t = o.tasks.count()
        return round(o.tasks.filter(status='done').count() * 100 / t) if t else 0

    def validate(self, attrs):
        s = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        e = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if s and e and e < s:
            raise serializers.ValidationError({'end_date': 'Дата окончания раньше даты начала'})
        return attrs


class ActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'user_name', 'project', 'project_name', 'text', 'created_at']

    def get_user_name(self, o):
        return o.user.get_full_name() or o.user.username
