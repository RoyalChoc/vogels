from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class BirdModel(Base):
    __tablename__ = "birds"

    id: Mapped[int] = mapped_column(primary_key=True)
    bird_key: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    stamnummer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    ringnummer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    ringmaat: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    geslacht: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    mutatie: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    gezoomd: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    factor: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    split1: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    split2: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    split3: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    split4: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    herkomst: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    kooi: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    kweekjaar: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    vader_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    moeder_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    aankoop_contact_id: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    opmerking: Mapped[str] = mapped_column(Text, nullable=False, default="")
