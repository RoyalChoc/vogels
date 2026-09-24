class VogelsError(Exception):
    """Base application error."""


class BirdNotFoundError(VogelsError):
    def __init__(self, key: str) -> None:
        super().__init__(f"Vogel niet gevonden: {key}")
        self.key = key


class DuplicateBirdError(VogelsError):
    def __init__(self, key: str) -> None:
        super().__init__(f"Vogel bestaat al: {key}")
        self.key = key


class CoupleNotFoundError(VogelsError):
    def __init__(self, name: str) -> None:
        super().__init__(f"Koppel niet gevonden: {name}")
        self.name = name


class DuplicateCoupleError(VogelsError):
    def __init__(self, name: str) -> None:
        super().__init__(f"Koppel bestaat al: {name}")
        self.name = name


class ContactNotFoundError(VogelsError):
    def __init__(self, contact_id: str) -> None:
        super().__init__(f"Contact niet gevonden: {contact_id}")
        self.contact_id = contact_id
