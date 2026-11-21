from django.urls import path
from . import views

urlpatterns = [
    path('team/', views.TeamView.as_view()),
    path('team/<int:pk>/role/', views.UserRoleView.as_view()),
]
