from django.http import Http404
from django.shortcuts import render

from apps.core.i18n import LOCALES, load_registry, merge_tool_labels


def tool_detail(request, locale: str, slug: str):
    if locale not in LOCALES:
        raise Http404
    registry = load_registry()
    meta = registry.get(slug)
    if not meta:
        raise Http404
    labels = merge_tool_labels(locale, slug)
    partial_name = f"tools/partials/{slug.replace('-', '_')}.html"
    return render(
        request,
        "tools/detail.html",
        {
            "locale": locale,
            "slug": slug,
            "tool": meta,
            "labels": labels,
            "tool_partial": partial_name,
        },
    )
