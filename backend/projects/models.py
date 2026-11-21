from django.conf import settings
from django.db import models


class Project(models.Model):
    PRIORITY = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    STATUS = [('planning', 'Planning'), ('active', 'Active'), ('on_hold', 'On hold'), ('completed', 'Completed')]
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY, default='medium')
    status = models.CharField(max_length=12, choices=STATUS, default='planning')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_projects')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='projects_in', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Activity(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def log(cls, project, user, text):
        cls.objects.create(project=project, user=user, text=text)
