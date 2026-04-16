from django.urls import path

from apps.tools import views

urlpatterns = [
    path("<str:locale>/tools/<slug:slug>/", views.tool_detail, name="tool_detail"),
]
