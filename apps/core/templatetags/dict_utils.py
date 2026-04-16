from django import template

register = template.Library()


@register.filter
def get_item(mapping, key):
    if mapping is None:
        return None
    if isinstance(mapping, dict):
        return mapping.get(key)
    try:
        return mapping[key]
    except (KeyError, TypeError):
        return None
