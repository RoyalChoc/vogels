"""
In-memory fake repositories for testing services without a real database.
"""

from app.schemas.state import BirdSchema


class FakeBirdRepository:
    def __init__(self, initial: dict[str, BirdSchema] | None = None) -> None:
        self._store: dict[str, BirdSchema] = dict(initial or {})

    def get_all(self) -> dict[str, BirdSchema]:
        return dict(self._store)

    def replace_all(self, birds: dict[str, BirdSchema]) -> None:
        self._store = dict(birds)


class FakeCoupleRepository:
    def __init__(self, initial: dict[str, dict] | None = None) -> None:
        self._store: dict[str, dict] = dict(initial or {})

    def get_all(self) -> dict[str, dict]:
        return dict(self._store)

    def replace_all(self, couples: dict[str, dict]) -> None:
        self._store = dict(couples)


class FakeContactRepository:
    def __init__(self, initial: dict[str, dict] | None = None) -> None:
        self._store: dict[str, dict] = dict(initial or {})

    def get_all(self) -> dict[str, dict]:
        return dict(self._store)

    def replace_all(self, contacts: dict[str, dict]) -> None:
        self._store = dict(contacts)


class FakeOptionRepository:
    def __init__(self, initial: dict[str, list[str]] | None = None) -> None:
        self._store: dict[str, list[str]] = dict(initial or {})

    def get_all(self) -> dict[str, list[str]]:
        return dict(self._store)

    def replace_all(self, options: dict[str, list[str]]) -> None:
        self._store = {k: list(v) for k, v in options.items()}
