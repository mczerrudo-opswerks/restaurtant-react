import logging
from rest_framework.views import exception_handler

logger = logging.getLogger('restaurantAPI')

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")
    view = context.get("view")

    logger.exception(
        "Unhandled exception in view=%s user=%s path=%s payload=%s",
        view.__class__.__name__ if view else None,
        getattr(request.user, "id", None),
        request.path if request else None,
        getattr(request, "data", None)
    )
    return response
