from django.urls import path

from apps.core import views

urlpatterns = [
    path("", views.root_redirect, name="root"),
    path("<str:locale>/tools/", views.tools_list, name="tools_list"),
    path("<str:locale>/", views.home, name="home"),
]
