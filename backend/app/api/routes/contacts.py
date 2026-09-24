from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_contact_service
from app.schemas.contacts import ContactsRequest, ContactsResponse
from app.services.contact_service import ContactService

router = APIRouter()


@router.get("", response_model=ContactsResponse)
def get_contacts(service: ContactService = Depends(get_contact_service)) -> ContactsResponse:
    contacts_raw = service.load()
    return ContactsResponse(contacts=contacts_raw)


@router.post("", response_model=dict)
def save_contacts(
    request: ContactsRequest,
    service: ContactService = Depends(get_contact_service),
) -> dict:
    try:
        service.save(request.contacts)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"ok": True}
