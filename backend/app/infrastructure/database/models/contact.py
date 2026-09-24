from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class ContactModel(Base):
    __tablename__ = "contacts"

    # Original IDs like "contact-1787547811600" are preserved as the PK
    contact_id: Mapped[str] = mapped_column(String(200), primary_key=True)
    naam: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    voornaam: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    straat: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    nummer: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    postcode: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    gemeente: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    provincie: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    gsmnummer: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    website: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Stored as JSONB: dict of custom field name -> value
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
