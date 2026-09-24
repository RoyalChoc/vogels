import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import VogelsError
from app.api.routes import state, contacts, options

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vogels API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(VogelsError)
async def vogels_error_handler(request: Request, exc: VogelsError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(state.router, prefix="/api/state")
app.include_router(contacts.router, prefix="/api/contacts")
app.include_router(options.router, prefix="/api/options")


@app.on_event("startup")
def on_startup() -> None:
    logger.info("Vogels API gestart. Omgeving: %s", settings.environment)
