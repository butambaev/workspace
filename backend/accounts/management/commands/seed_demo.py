from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models import Notification
from projects.models import Activity, Project
from tasks.models import Comment, Task

User = get_user_model()


class Command(BaseCommand):
    help = 'Заполняет базу демонстрационными данными (если пользователей ещё нет)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Создать данные, даже если пользователи уже есть')

    def handle(self, *args, **opts):
        if User.objects.exists() and not opts['force']:
            self.stdout.write('Данные уже есть — пропуск (используйте --force).')
            return
        mk = lambda u, e, f, l, r, p: User.objects.filter(username=u).first() or User.objects.create_user(
            username=u, email=e, first_name=f, last_name=l, password=p, role=r)
        admin = mk('admin', 'admin@workspace.local', 'Админ', 'Системный', 'admin', 'admin12345')
        admin.role = 'admin'; admin.is_staff = admin.is_superuser = True; admin.save()
        manager = mk('manager', 'manager@workspace.local', 'Мария', 'Петрова', 'manager', 'manager12345')
        manager.role = 'manager'; manager.save()
        members = []
        for u, f, l in [('anna', 'Анна', 'Иванова'), ('ivan', 'Иван', 'Сидоров'), ('olga', 'Ольга', 'Смирнова')]:
            m = mk(u, f'{u}@workspace.local', f, l, 'member', 'member12345')
            m.role = 'member'; m.save(); members.append(m)
        today = timezone.localdate()
        specs = [
            ('Редизайн сайта', 'Обновление корпоративного сайта', 'active', 'high', admin, members[:2]),
            ('Мобильное приложение', 'Разработка MVP мобильного клиента', 'active', 'medium', manager, members),
            ('Маркетинговая кампания', 'Запуск осенней кампании', 'planning', 'low', manager, members[1:]),
        ]
        titles = ['Составить ТЗ', 'Подготовить макеты', 'Настроить окружение', 'Реализовать API', 'Тестирование', 'Подготовить релиз']
        for pi, (name, desc, st, pr, owner, mem) in enumerate(specs):
            p = Project.objects.create(name=name, description=desc, status=st, priority=pr, owner=owner,
                                       start_date=today - timedelta(days=20), end_date=today + timedelta(days=40))
            p.members.add(owner, manager, *mem)
            Activity.log(p, owner, f'создал проект «{p.name}»')
            for i, title in enumerate(titles):
                status = ['done', 'done', 'in_progress', 'in_progress', 'todo', 'todo'][i]
                assignee = mem[i % len(mem)]
                t = Task.objects.create(
                    project=p, title=title, description=f'{title} для проекта «{name}»', assignee=assignee, creator=owner,
                    priority=['low', 'medium', 'high'][(i + pi) % 3], status=status,
                    deadline=today + timedelta(days=(i * 5) - 8 if i != 4 else 7),
                    completed_at=timezone.now() - timedelta(days=i) if status == 'done' else None)
                if i % 2 == 0:
                    Comment.objects.create(task=t, author=owner, text='Давайте обсудим детали на встрече.')
                    Comment.objects.create(task=t, author=assignee, text='Принято, приступаю.')
                Notification.objects.create(user=assignee, text=f'Вам назначена задача «{t.title}»', link=f'/tasks?open={t.id}')
                Activity.log(p, owner, f'создал задачу «{t.title}»')
            for m in mem:
                Notification.objects.create(user=m, text=f'Вас добавили в проект «{p.name}»', link=f'/projects/{p.id}')
        self.stdout.write(self.style.SUCCESS('Демо-данные созданы. admin / admin12345'))
