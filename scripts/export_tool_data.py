#!/usr/bin/env python3
"""One-time export of tool registry and i18n from legacy frontend/components/tools."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = ROOT / "frontend" / "components" / "tools"
TOOLS_CONFIG = ROOT / "frontend" / "tools.config.json"
MESSAGES = {
    "en": ROOT / "frontend" / "messages" / "en.json",
    "zh": ROOT / "frontend" / "messages" / "zh.json",
}
OUT_DIR = ROOT / "data"


def load_tools_config() -> dict:
    if not TOOLS_CONFIG.exists():
        return {}
    try:
        return json.loads(TOOLS_CONFIG.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def is_enabled(slug: str, cfg: dict) -> bool:
    tools = (cfg.get("tools") or {}) if isinstance(cfg, dict) else {}
    return tools.get(slug, {}).get("enabled") is not False


def parse_meta(meta_path: Path) -> dict | None:
    text = meta_path.read_text(encoding="utf-8")
    slug_m = re.search(r'slug:\s*["\']([^"\']+)["\']', text)
    cat_m = re.search(r'category:\s*["\']([^"\']+)["\']', text)
    if not slug_m or not cat_m:
        return None
    meta: dict = {"slug": slug_m.group(1), "category": cat_m.group(1)}
    tags_m = re.search(r"tags:\s*\[([^\]]*)\]", text)
    if tags_m:
        meta["tags"] = [
            t.strip().strip("\"'")
            for t in tags_m.group(1).split(",")
            if t.strip()
        ]
    icon_m = re.search(r'icon:\s*["\']([^"\']+)["\']', text)
    if icon_m:
        meta["icon"] = icon_m.group(1)
    kw_m = re.search(r"keywords:\s*\[([^\]]*)\]", text)
    if kw_m:
        meta["seo"] = {
            "keywords": [
                k.strip().strip("\"'")
                for k in kw_m.group(1).split(",")
                if k.strip()
            ]
        }
    return meta


def main() -> int:
    if not TOOLS_DIR.is_dir():
        print(
            f"Missing {TOOLS_DIR} — place the legacy Next.js `components/tools` tree here to re-export, "
            "or edit data/registry.json and data/tool_i18n.json by hand.",
            file=sys.stderr,
        )
        return 1

    cfg = load_tools_config()
    registry: dict[str, dict] = {}
    tool_i18n: dict[str, dict[str, dict]] = {"en": {}, "zh": {}}

    for folder in sorted(TOOLS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        meta_path = folder / "meta.ts"
        if not meta_path.exists():
            continue
        meta = parse_meta(meta_path)
        if not meta:
            continue
        slug = meta["slug"]
        if not is_enabled(slug, cfg):
            continue
        registry[slug] = meta
        for loc in ("en", "zh"):
            p = folder / "i18n" / f"{loc}.json"
            if p.exists():
                try:
                    tool_i18n[loc][slug] = json.loads(p.read_text(encoding="utf-8"))
                except json.JSONDecodeError:
                    print(f"Warning: bad JSON {p}", file=sys.stderr)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "registry.json").write_text(
        json.dumps(registry, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "tool_i18n.json").write_text(
        json.dumps(tool_i18n, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    for loc, path in MESSAGES.items():
        if path.exists():
            dest = OUT_DIR / f"messages_{loc}.json"
            dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")

    print(f"Exported {len(registry)} tools to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
