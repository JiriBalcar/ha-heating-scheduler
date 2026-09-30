"""Plain-language texts for reasons (Czech and English).

The panel renders reasons itself in the viewer's language. These texts serve entity
attributes and logs, in the Home Assistant system language.
"""

from __future__ import annotations

from datetime import datetime, timedelta, tzinfo

from .model import Reason, Source, TargetMode

DEFAULT_LANGUAGE = "cs"
LANGUAGES = ("cs", "en")

# Names of the house plan and the house temperatures in a new installation.
# Names of the house plan, the house temperatures and the first zone.
DEFAULT_NAMES: dict[str, tuple[str, str, str]] = {
    "cs": ("Plán domu", "Teploty domu", "Dům"),
    "en": ("House plan", "House temperatures", "House"),
}

MODE_NAMES: dict[str, dict[TargetMode, str]] = {
    "cs": {
        TargetMode.COMFORT: "Teplo",
        TargetMode.ECO: "Úspora",
        TargetMode.NIGHT: "Noc",
        TargetMode.AWAY: "Pryč",
        TargetMode.FROST: "Proti mrazu",
        TargetMode.OFF: "Vypnuto",
        TargetMode.MANUAL: "Ručně",
        TargetMode.BOOST: "Naplno",
    },
    "en": {
        TargetMode.COMFORT: "Warm",
        TargetMode.ECO: "Saving",
        TargetMode.NIGHT: "Night",
        TargetMode.AWAY: "Away",
        TargetMode.FROST: "Frost guard",
        TargetMode.OFF: "Off",
        TargetMode.MANUAL: "By hand",
        TargetMode.BOOST: "Boost",
    },
}

# Czech uses the genitive after "do" ("until"): "do pondělí 06:00".
_WEEKDAYS_UNTIL: dict[str, tuple[str, ...]] = {
    "cs": ("pondělí", "úterý", "středy", "čtvrtka", "pátku", "soboty", "neděle"),
    "en": ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
}
_MONTHS_EN = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

_TEMPLATES: dict[str, dict[Source, tuple[str, str]]] = {
    # source: (text without "until", text with "until")
    "cs": {
        Source.PLAN: ("Plán: {mode}", "Plán: {mode} do {until}"),
        Source.MANUAL: ("Ručně změněno", "Ručně změněno do {until}"),
        Source.HOUSE_AWAY: ("Dům: Pryč", "Dům: Pryč do {until}"),
        Source.VACATION: ("Dovolená", "Dovolená do {until}"),
        Source.HOUSE_OFF: ("Topení vypnuto", "Topení vypnuto do {until}"),
        Source.BOOST: ("Zatápí se naplno", "Zatápí se naplno do {until}"),
    },
    "en": {
        Source.PLAN: ("Schedule: {mode}", "Schedule: {mode} until {until}"),
        Source.MANUAL: ("Changed by hand", "Changed by hand until {until}"),
        Source.HOUSE_AWAY: ("House: Away", "House: Away until {until}"),
        Source.VACATION: ("Holiday", "Holiday until {until}"),
        Source.HOUSE_OFF: ("Heating off", "Heating off until {until}"),
        Source.BOOST: ("Boost", "Boost until {until}"),
    },
}


def language(value: str | None) -> str:
    """Return a supported language for a language tag such as 'cs', 'en-GB'."""
    if value:
        base = value.replace("_", "-").split("-")[0].lower()
        if base in LANGUAGES:
            return base
    return DEFAULT_LANGUAGE


def mode_name(mode: TargetMode, lang: str | None) -> str:
    """Return the plain-language name of a mode."""
    return MODE_NAMES[language(lang)][mode]


def format_until(until: datetime, now: datetime, tz: tzinfo, lang: str | None) -> str:
    """Format the end of a period relative to `now`.

    Within 24 h: "06:00". Within a week: weekday and time. Later: date and time.
    """
    lang = language(lang)
    local = until.astimezone(tz)
    clock = f"{local.hour:02d}:{local.minute:02d}"
    delta = until - now
    if delta < timedelta(hours=24):
        return clock
    if delta < timedelta(days=7):
        return f"{_WEEKDAYS_UNTIL[lang][local.weekday()]} {clock}"
    if lang == "cs":
        return f"{local.day}. {local.month}. {clock}"
    return f"{local.day} {_MONTHS_EN[local.month - 1]} {clock}"


def render_reason(reason: Reason, now: datetime, tz: tzinfo, lang: str | None) -> str:
    """Return the reason as one short sentence, e.g. 'Schedule: Night until 06:00'."""
    lang = language(lang)
    short, long = _TEMPLATES[lang][reason.source]
    mode = MODE_NAMES[lang][reason.mode]
    if reason.until is None:
        return short.format(mode=mode)
    return long.format(mode=mode, until=format_until(reason.until, now, tz, lang))
