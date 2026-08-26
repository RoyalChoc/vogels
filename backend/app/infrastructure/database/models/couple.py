from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class CoupleModel(Base):
    __tablename__ = "couples"

    id: Mapped[int] = mapped_column(primary_key=True)
    couple_name: Mapped[str] = mapped_column(String(200), nullable=False)
    man_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    pop_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    kooi: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    kweekjaar: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    # Stored as JSONB: list of bird display names
    jongen: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # Stored as JSONB: list of round objects with egg data
    rondes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    aantal_jong_uit: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    opmerking_kweek: Mapped[str] = mapped_column(Text, nullable=False, default="")

    __table_args__ = (UniqueConstraint("couple_name", name="uq_couples_couple_name"),)
