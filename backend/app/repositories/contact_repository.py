from sqlalchemy.orm import Session

from app.infrastructure.database.models.contact import ContactModel


class SqlAlchemyContactRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_all(self) -> dict[str, dict]:
        rows = self._db.query(ContactModel).all()
        return {row.contact_id: self._to_dict(row) for row in rows}

    def replace_all(self, contacts: dict[str, dict]) -> None:
        self._db.query(ContactModel).delete()
        for contact_id, data in contacts.items():
            self._db.add(ContactModel(
                contact_id=contact_id,
                naam=str(data.get("Naam") or ""),
                voornaam=str(data.get("Voornaam") or ""),
                straat=str(data.get("Straat") or ""),
                nummer=str(data.get("Nummer") or ""),
                postcode=str(data.get("Postcode") or ""),
                gemeente=str(data.get("Gemeente") or ""),
                provincie=str(data.get("Provincie") or ""),
                gsmnummer=str(data.get("Gsmnummer") or ""),
                website=str(data.get("Website") or ""),
                extra=data.get("Extra") if isinstance(data.get("Extra"), dict) else {},
            ))

    @staticmethod
    def _to_dict(row: ContactModel) -> dict:
        return {
            "Naam": row.naam,
            "Voornaam": row.voornaam,
            "Straat": row.straat,
            "Nummer": row.nummer,
            "Postcode": row.postcode,
            "Gemeente": row.gemeente,
            "Provincie": row.provincie,
            "Gsmnummer": row.gsmnummer,
            "Website": row.website,
            "Extra": row.extra if isinstance(row.extra, dict) else {},
        }
