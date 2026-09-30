"""Plain-language texts for reasons (Czech and English).

The panel renders reasons itself in the viewer's language. These texts serve entity
attributes and logs, in the Home Assistant system language.
"""

from __future__ import annotations

from datetime import datetime, timedelta, tzinfo

from .model import Reason, RoomTarget, Source, TargetMode

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


# The first valve problem of a room, by the kind of health issue, as the panel shows it.
ISSUE_TEXTS: dict[str, dict[str, str]] = {
    "cs": {
        "unavailable": "Hlavice neodpovídá",
        "write_failed": "Hlavice nepřijala teplotu",
        "mismatch": "Hlavice má jinou teplotu",
    },
    "en": {
        "unavailable": "A valve does not respond",
        "write_failed": "A valve did not take the temperature",
        "mismatch": "A valve has a different temperature",
    },
}
_NO_TRVS = {"cs": "Zatím bez hlavic.", "en": "No radiator valves yet."}
_UNTIL = {"cs": "do", "en": "until"}


def format_temperature(celsius: float, lang: str | None, unit: str = "°C") -> str:
    """Return '18,0 °C' in Czech, '18.0 °C' in English; in °F when Home Assistant uses it."""
    value = celsius * 9 / 5 + 32 if unit == "°F" else celsius
    text = f"{value:.1f}"
    return f"{text.replace('.', ',') if language(lang) == 'cs' else text} {unit}"


def render_status(
    target: RoomTarget,
    now: datetime,
    tz: tzinfo,
    lang: str | None,
    *,
    zone: str | None = None,
    issue: str | None = None,
    no_trvs: bool = False,
    unit: str = "°C",
) -> str:
    """Return a room's state as the panel's room tile shows it after the temperature.

    "Warm until 22:00 → Night 18.0 °C" while the plan runs; otherwise the reason, with the
    zone's name for Away while the house has zones (`zone`). A valve problem (`issue`, the kind
    of the first health issue) comes first.
    """
    lang = language(lang)
    if issue is not None:
        return ISSUE_TEXTS[lang].get(issue, issue)
    if no_trvs:
        return _NO_TRVS[lang]
    until = (
        None
        if target.valid_until is None
        else f" {_UNTIL[lang]} {format_until(target.valid_until, now, tz, lang)}"
    )
    if target.source is Source.PLAN:
        text = MODE_NAMES[lang][target.mode]
        if until is None:
            return text
        text += until
        upcoming = target.next
        if upcoming is not None:
            text += f" → {MODE_NAMES[lang][upcoming.mode]}"
            if upcoming.temperature is not None:
                text += f" {format_temperature(upcoming.temperature, lang, unit)}"
        return text
    if target.source is Source.HOUSE_AWAY and zone is not None:
        return f"{zone}: {MODE_NAMES[lang][TargetMode.AWAY]}{until or ''}"
    return render_reason(target.reason, now, tz, lang)


def render_reason(reason: Reason, now: datetime, tz: tzinfo, lang: str | None) -> str:
    """Return the reason as one short sentence, e.g. 'Schedule: Night until 06:00'."""
    lang = language(lang)
    short, long = _TEMPLATES[lang][reason.source]
    mode = MODE_NAMES[lang][reason.mode]
    if reason.until is None:
        return short.format(mode=mode)
    return long.format(mode=mode, until=format_until(reason.until, now, tz, lang))
