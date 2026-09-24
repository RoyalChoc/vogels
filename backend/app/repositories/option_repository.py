from sqlalchemy.orm import Session

from app.infrastructure.database.models.option_set import OptionSetModel
from app.schemas.options import KNOWN_OPTION_KEYS


class SqlAlchemyOptionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_all(self) -> dict[str, list[str]]:
        rows = self._db.query(OptionSetModel).filter(
            OptionSetModel.option_key.in_(KNOWN_OPTION_KEYS)
        ).all()
        stored = {row.option_key: row.values for row in rows}
        # Return empty list for keys not yet stored
        return {key: stored.get(key, []) for key in KNOWN_OPTION_KEYS}

    def replace_all(self, options: dict[str, list[str]]) -> None:
        keys = list(KNOWN_OPTION_KEYS & options.keys())
        self._db.query(OptionSetModel).filter(
            OptionSetModel.option_key.in_(keys)
        ).delete(synchronize_session=False)
        for key in keys:
            values = [str(v) for v in (options.get(key) or []) if str(v).strip()]
            self._db.add(OptionSetModel(option_key=key, values=values))
