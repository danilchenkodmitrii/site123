from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import User, Room, Booking, Role, async_session

admin_router = APIRouter()

@admin_router.get("/users")
async def get_all_users():
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        return [user.to_dict() for user in users]

@admin_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, data: dict):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        role_result = await session.execute(select(Role).where(Role.name == data.get("role")))
        role = role_result.scalar()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        user.role_id = role.id
        await session.commit()
        return user.to_dict()

@admin_router.get("/stats")
async def get_stats():
    async with async_session() as session:
        users_count = await session.execute(select(len(select(User))))
        rooms_count = await session.execute(select(len(select(Room))))
        bookings_count = await session.execute(select(len(select(Booking))))
        
        return {
            "totalUsers": users_count,
            "totalRooms": rooms_count,
            "totalBookings": bookings_count
        }