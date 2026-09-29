"""Convert domain validation errors into Home Assistant errors."""

from __future__ import annotations

from homeassistant.exceptions import ServiceValidationError

from .const import DOMAIN
from .core.validation import ValidationError


def service_error(err: ValidationError) -> ServiceValidationError:
    """Return a translated service error for a validation error."""
    return ServiceValidationError(
        str(err),
        translation_domain=DOMAIN,
        translation_key=err.code,
        translation_placeholders={key: str(value) for key, value in err.details.items()},
    )
