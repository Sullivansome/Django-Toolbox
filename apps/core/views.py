from django.http import Http404
from django.shortcuts import redirect, render

from apps.core.i18n import (
    LOCALES,
    group_tools_by_category,
    load_messages,
    load_registry,
)


def root_redirect(request):
    return redirect("/en/")


def home(request, locale: str):
    if locale not in LOCALES:
        raise Http404
    messages = load_messages(locale)
    registry = load_registry()
    grouped = group_tools_by_category(registry)
    return render(
        request,
        "home.html",
        {
            "locale": locale,
            "ui": messages,
            "grouped_tools": grouped,
        },
    )


def tools_list(request, locale: str):
    if locale not in LOCALES:
        raise Http404
    messages = load_messages(locale)
    registry = load_registry()
    grouped = group_tools_by_category(registry)
    return render(
        request,
        "tools/list.html",
        {
            "locale": locale,
            "ui": messages,
            "grouped_tools": grouped,
        },
    )
