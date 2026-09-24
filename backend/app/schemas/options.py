from pydantic import BaseModel

KNOWN_OPTION_KEYS = frozenset({
    "factor",
    "geslacht",
    "gezoomd",
    "herkomst",
    "jaren",
    "kooien",
    "mutaties",
    "ringmaten",
    "split",
    "status",
    "contactvelden",
})


class OptionsRequest(BaseModel):
    options: dict[str, list[str]] = {}


class OptionsResponse(BaseModel):
    options: dict[str, list[str]] = {}
