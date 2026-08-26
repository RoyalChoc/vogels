import logging
from sqlalchemy.orm import Session

from app.repositories.option_repository import SqlAlchemyOptionRepository

logger = logging.getLogger(__name__)


class OptionService:
    def __init__(self, db: Session) -> None:
        self._repository = SqlAlchemyOptionRepository(db)
        self._db = db

    def load(self) -> dict[str, list[str]]:
        options = self._repository.get_all()
        logger.debug("Loaded options for %d keys", len(options))
        return options

    def save(self, options: dict[str, list[str]]) -> None:
        self._repository.replace_all(options)
        self._db.commit()
        logger.info("Saved options for keys: %s", list(options.keys()))
