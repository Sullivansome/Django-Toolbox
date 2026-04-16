from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from django.conf import settings

LOCALES = frozenset({"en", "zh"})
DEFAULT_LOCALE = "en"

CATEGORY_ORDER: tuple[str, ...] = (
    "productivity",
    "design",
    "social",
    "life",
    "conversion",
    "dev",
    "text",
    "media",
    "security",
    "time",
    "math",
    "wasm",
)


@lru_cache(maxsize=4)
def load_messages(locale: str) -> dict:
    path = Path(settings.BASE_DIR) / "data" / f"messages_{locale}.json"
    if not path.exists():
        path = Path(settings.BASE_DIR) / "data" / f"messages_{DEFAULT_LOCALE}.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_tool_i18n() -> dict[str, dict[str, dict]]:
    path = Path(settings.BASE_DIR) / "data" / "tool_i18n.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_registry() -> dict[str, dict]:
    path = Path(settings.BASE_DIR) / "data" / "registry.json"
    return json.loads(path.read_text(encoding="utf-8"))


def merge_tool_labels(locale: str, slug: str) -> dict:
    messages = load_messages(locale)
    tool_i18n = load_tool_i18n()
    base = (messages.get("tools") or {}).get(slug) or {}
    extra = (tool_i18n.get(locale) or {}).get(slug) or {}
    name = extra.get("name") or base.get("name") or slug
    description = extra.get("description") or base.get("description") or ""
    merged = {**base, **extra, "name": name, "description": description}
    return merged


def group_tools_by_category(registry: dict[str, dict]) -> list[dict]:
    tools = list(registry.values())
    out: list[dict] = []
    for category in CATEGORY_ORDER:
        group = [t for t in tools if t.get("category") == category]
        if group:
            out.append({"category": category, "tools": sorted(group, key=lambda t: t["slug"])})
    return out


def search_tools_payload(locale: str) -> list[dict]:
    registry = load_registry()
    messages = load_messages(locale)
    tool_i18n = load_tool_i18n()
    base_tools = messages.get("tools") or {}
    extra = tool_i18n.get(locale) or {}
    items: list[dict] = []
    for slug, meta in sorted(registry.items()):
        b = base_tools.get(slug) or {}
        e = extra.get(slug) or {}
        name = e.get("name") or b.get("name") or slug
        desc = e.get("description") or b.get("description") or ""
        items.append(
            {
                "slug": slug,
                "name": name,
                "description": desc,
                "category": meta.get("category") or "",
            }
        )
    return items
