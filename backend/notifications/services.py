from .models import Notification


def notify(user, text, link='', actor=None):
    """Создаёт уведомление (не уведомляет пользователя о его собственных действиях)."""
    if user and (actor is None or user.id != actor.id):
        Notification.objects.create(user=user, text=text, link=link)
