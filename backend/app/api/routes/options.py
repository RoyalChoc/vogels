from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_option_service
from app.schemas.options import OptionsRequest, OptionsResponse
from app.services.option_service import OptionService

router = APIRouter()


@router.get("", response_model=OptionsResponse)
def get_options(service: OptionService = Depends(get_option_service)) -> OptionsResponse:
    options = service.load()
    return OptionsResponse(options=options)


@router.post("", response_model=dict)
def save_options(
    request: OptionsRequest,
    service: OptionService = Depends(get_option_service),
) -> dict:
    try:
        service.save(request.options)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"ok": True}
