from apps.core.i18n import DEFAULT_LOCALE, LOCALES


class LocaleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        parts = [p for p in request.path.split("/") if p]
        if parts and parts[0] in LOCALES:
            request.locale = parts[0]
        else:
            request.locale = DEFAULT_LOCALE
        return self.get_response(request)
