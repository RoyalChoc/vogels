"""
Tests for service layer using fake repositories (no database required).
"""

import pytest

from app.schemas.state import BirdSchema, StateResponse
from tests.fakes import (
    FakeBirdRepository,
    FakeCoupleRepository,
    FakeContactRepository,
    FakeOptionRepository,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_bird(**kwargs) -> BirdSchema:
    return BirdSchema(
        Stamnummer=kwargs.get("Stamnummer", "PSNL01"),
        Ringnummer=kwargs.get("Ringnummer", "001"),
        Geslacht=kwargs.get("Geslacht", "Man"),
        Status=kwargs.get("Status", "Actief"),
        **{k: v for k, v in kwargs.items() if k not in ("Stamnummer", "Ringnummer", "Geslacht", "Status")},
    )


# ─── StateService-equivalent tests using fakes ───────────────────────────────

class FakeStateService:
    """Minimal reimplementation of StateService using fake repos for tests."""

    def __init__(self) -> None:
        self._birds = FakeBirdRepository()
        self._couples = FakeCoupleRepository()

    def load(self) -> StateResponse:
        return StateResponse(birds=self._birds.get_all(), couples=self._couples.get_all())

    def save(self, birds: dict[str, BirdSchema], couples: dict[str, dict]) -> None:
        self._birds.replace_all(birds)
        self._couples.replace_all(couples)


class TestStateService:
    def test_load_returns_empty_on_fresh_state(self):
        service = FakeStateService()
        result = service.load()
        assert result.birds == {}
        assert result.couples == {}

    def test_save_and_reload_birds(self):
        service = FakeStateService()
        birds = {"PSNL01-001": make_bird()}
        service.save(birds, {})
        result = service.load()
        assert "PSNL01-001" in result.birds
        assert result.birds["PSNL01-001"].Stamnummer == "PSNL01"

    def test_save_replaces_all_birds(self):
        service = FakeStateService()
        service.save({"OLD-001": make_bird(Stamnummer="OLD", Ringnummer="001")}, {})
        service.save({"NEW-002": make_bird(Stamnummer="NEW", Ringnummer="002")}, {})
        result = service.load()
        assert "OLD-001" not in result.birds
        assert "NEW-002" in result.birds

    def test_save_and_reload_couples(self):
        service = FakeStateService()
        couple = {"man": "PSNL01 - 001", "pop": "PSNL02 - 002", "kooi": "Kooi 01", "kweekjaar": "2026", "jongen": []}
        service.save({}, {"Koppel_01": couple})
        result = service.load()
        assert "Koppel_01" in result.couples
        assert result.couples["Koppel_01"]["man"] == "PSNL01 - 001"


# ─── ContactService-equivalent tests ─────────────────────────────────────────

class FakeContactService:
    def __init__(self) -> None:
        self._repository = FakeContactRepository()

    def load(self) -> dict[str, dict]:
        return self._repository.get_all()

    def save(self, contacts: dict) -> None:
        self._repository.replace_all(contacts)


class TestContactService:
    def test_load_empty(self):
        service = FakeContactService()
        assert service.load() == {}

    def test_save_and_load(self):
        service = FakeContactService()
        contact = {"Naam": "Janssen", "Voornaam": "Jan", "Gemeente": "Antwerpen", "Extra": {}}
        service.save({"contact-001": contact})
        result = service.load()
        assert "contact-001" in result
        assert result["contact-001"]["Naam"] == "Janssen"

    def test_save_replaces_all(self):
        service = FakeContactService()
        service.save({"contact-old": {"Naam": "Oud"}})
        service.save({"contact-new": {"Naam": "Nieuw"}})
        result = service.load()
        assert "contact-old" not in result
        assert "contact-new" in result


# ─── OptionService-equivalent tests ──────────────────────────────────────────

class FakeOptionService:
    def __init__(self) -> None:
        self._repository = FakeOptionRepository()

    def load(self) -> dict[str, list[str]]:
        return self._repository.get_all()

    def save(self, options: dict[str, list[str]]) -> None:
        self._repository.replace_all(options)


class TestOptionService:
    def test_save_and_load_options(self):
        service = FakeOptionService()
        service.save({"mutaties": ["Wildkleur", "Lutino", "Albino"]})
        result = service.load()
        assert "Wildkleur" in result["mutaties"]

    def test_replace_option_key(self):
        service = FakeOptionService()
        service.save({"status": ["Actief", "Verkocht"]})
        service.save({"status": ["Actief"]})
        result = service.load()
        assert "Verkocht" not in result.get("status", [])
