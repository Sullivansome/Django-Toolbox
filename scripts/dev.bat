@echo off
echo Starting Django Toolbox...
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
