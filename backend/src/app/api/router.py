from fastapi import APIRouter

from app.api import admin, guest

api_router = APIRouter()
api_router.include_router(guest.router)
api_router.include_router(admin.router)
