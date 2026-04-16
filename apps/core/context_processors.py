import json

from django.conf import settings

from apps.core.i18n import load_messages, search_tools_payload


def site_globals(request):
    locale = getattr(request, "locale", "en")
    messages = load_messages(locale)
    return {
        "layout_messages": messages.get("layout") or {},
        "categories_messages": messages.get("categories") or {},
        "tools_messages": messages.get("tools") or {},
        "search_tools_json": json.dumps(search_tools_payload(locale)),
        "current_locale": locale,
        "base_url": getattr(settings, "PUBLIC_BASE_URL", "").rstrip("/"),
    }
