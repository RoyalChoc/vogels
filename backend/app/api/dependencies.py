from collections.abc import Generator
from sqlalchemy.orm import Session
from fastapi import Depends

from app.infrastructure.database.database import get_db
from app.services.state_service import StateService
from app.services.contact_service import ContactService
from app.services.option_service import OptionService


def get_state_service(db: Session = Depends(get_db)) -> StateService:
    return StateService(db)


def get_contact_service(db: Session = Depends(get_db)) -> ContactService:
    return ContactService(db)


def get_option_service(db: Session = Depends(get_db)) -> OptionService:
    return OptionService(db)
