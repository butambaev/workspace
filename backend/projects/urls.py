from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import DashboardView, ProjectViewSet

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
urlpatterns = [path('dashboard/', DashboardView.as_view()), path('', include(router.urls))]
