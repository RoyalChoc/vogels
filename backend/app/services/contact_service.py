import logging
from sqlalchemy.orm import Session

from app.repositories.contact_repository import SqlAlchemyContactRepository
from app.schemas.contacts import ContactSchema

logger = logging.getLogger(__name__)


class ContactService:
    def __init__(self, db: Session) -> None:
        self._repository = SqlAlchemyContactRepository(db)
        self._db = db

    def load(self) -> dict[str, dict]:
        contacts = self._repository.get_all()
        logger.debug("Loaded %d contacts", len(contacts))
        return contacts

    def save(self, contacts: dict[str, ContactSchema]) -> None:
        raw = {k: v.model_dump() for k, v in contacts.items()}
        self._repository.replace_all(raw)
        self._db.commit()
        logger.info("Saved %d contacts", len(contacts))
