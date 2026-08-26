from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class OptionSetModel(Base):
    __tablename__ = "option_sets"

    # Key matches JSON file stem: "factor", "geslacht", "mutaties", etc.
    option_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    values: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
