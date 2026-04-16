from django import template

register = template.Library()


@register.simple_tag
def switch_locale_path(path: str, new_locale: str) -> str:
    parts = [p for p in path.split("/") if p]
    if parts and parts[0] in ("en", "zh"):
        parts[0] = new_locale
    else:
        parts.insert(0, new_locale)
    out = "/" + "/".join(parts)
    if not out.endswith("/"):
        out += "/"
    return out
