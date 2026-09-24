from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_state_service
from app.schemas.state import StateRequest, StateResponse
from app.services.state_service import StateService

router = APIRouter()


@router.get("", response_model=StateResponse)
def get_state(service: StateService = Depends(get_state_service)) -> StateResponse:
    return service.load()


@router.post("", response_model=dict)
def save_state(
    request: StateRequest,
    service: StateService = Depends(get_state_service),
) -> dict:
    try:
        service.save(request.birds, request.couples)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"ok": True}
