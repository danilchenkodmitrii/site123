from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from models import async_session
from repositories import UserRepository

users_router = APIRouter()

@users_router.get("/")
async def get_all_users():
    async with async_session() as session:
        users = await UserRepository.get_all_users(session)
        return [user.to_dict() for user in users]

@users_router.get("/{user_id}")
async def get_user(user_id: str):
    async with async_session() as session:
        user = await UserRepository.get_user_by_id(session, user_id)
        if user:
            return user.to_dict()
        raise HTTPException(status_code=404, detail="User not found")

@users_router.post("/register")
async def register(data: dict):
    async with async_session() as session:
        user = await UserRepository.create_user(session, data["firstName"], data["lastName"], data["email"], data["password"])
        if not user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        return user.to_dict()

@users_router.post("/login")
async def login(data: dict):
    async with async_session() as session:
        user = await UserRepository.get_user_by_id(session, data.get("user_id"))
        if user:
            return user.to_dict()
        raise HTTPException(status_code=404, detail="User not found")

@users_router.put("/{user_id}/role")
async def update_user_role(user_id: str, data: dict):
    async with async_session() as session:
        user = await UserRepository.update_user_role(session, user_id, data.get("role"))
        if not user:
            raise HTTPException(status_code=404, detail="User or role not found")
        return user.to_dict()