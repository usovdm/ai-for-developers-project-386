from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import get_settings
from app.schemas.errors import ApiError, ApiErrorResponse
from app.storage.database import init_db


HTML_FALLBACK_EXCLUDED_PATHS = ("/docs", "/redoc", "/openapi.json")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Meeting Booking API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiErrorResponse(error=exc.body).model_dump(by_alias=True, exclude_none=True),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed",
                    "details": str(exc),
                }
            },
        )

    app.include_router(api_router)
    mount_frontend(app, settings.static_dir)
    return app


def mount_frontend(app: FastAPI, static_dir: str) -> None:
    if not static_dir:
        return

    dist_dir = Path(static_dir).resolve()
    index_path = dist_dir / "index.html"
    if not index_path.is_file():
        return

    assets_dir = dist_dir / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.middleware("http")
    async def frontend_html_fallback(request: Request, call_next):
        accepts_html = "text/html" in request.headers.get("accept", "")
        is_html_navigation = request.method in {"GET", "HEAD"} and accepts_html
        is_docs_path = request.url.path.startswith(HTML_FALLBACK_EXCLUDED_PATHS)

        if is_html_navigation and not is_docs_path:
            return FileResponse(index_path)

        return await call_next(request)

    @app.get("/{static_path:path}", include_in_schema=False)
    def get_frontend_file(static_path: str):
        requested_path = (dist_dir / static_path).resolve()
        if dist_dir == requested_path or dist_dir in requested_path.parents:
            if requested_path.is_file():
                return FileResponse(requested_path)

        if static_path == "":
            return FileResponse(index_path)

        raise HTTPException(status_code=404, detail="Not found")


app = create_app()
