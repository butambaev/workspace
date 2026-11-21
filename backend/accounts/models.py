from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [('admin', 'Admin'), ('manager', 'Manager'), ('member', 'Member')]
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLES, default='member')
    avatar = models.TextField(blank=True)  # data-URL (уменьшается на клиенте)

    def save(self, *args, **kwargs):
        # первый пользователь системы и суперпользователи — администраторы
        if self.is_superuser or (self._state.adding and not User.objects.exists()):
            self.role = 'admin'
        super().save(*args, **kwargs)
