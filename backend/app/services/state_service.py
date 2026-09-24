import logging
from sqlalchemy.orm import Session

from app.repositories.bird_repository import SqlAlchemyBirdRepository
from app.repositories.couple_repository import SqlAlchemyCoupleRepository
from app.schemas.state import StateResponse, BirdSchema

logger = logging.getLogger(__name__)


class StateService:
    """Coordinates loading and saving of birds and couples as a single unit."""

    def __init__(self, db: Session) -> None:
        self._birds = SqlAlchemyBirdRepository(db)
        self._couples = SqlAlchemyCoupleRepository(db)
        self._db = db

    def load(self) -> StateResponse:
        birds = self._birds.get_all()
        couples = self._couples.get_all()
        logger.debug("Loaded %d birds, %d couples", len(birds), len(couples))
        return StateResponse(birds=birds, couples=couples)

    def save(self, birds: dict[str, BirdSchema], couples: dict[str, dict]) -> None:
        self._birds.replace_all(birds)
        self._couples.replace_all(couples)
        self._db.commit()
        logger.info("Saved %d birds, %d couples", len(birds), len(couples))
