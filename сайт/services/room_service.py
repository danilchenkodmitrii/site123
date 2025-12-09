from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Room
import uuid

class RoomService:
    @staticmethod
    async def get_all_rooms(session: AsyncSession):
        result = await session.execute(select(Room))
        return result.scalars().all()
    
    @staticmethod
    async def get_room_by_id(session: AsyncSession, room_id: str):
        result = await session.execute(select(Room).where(Room.id == room_id))
        return result.scalar()
    
    @staticmethod
    async def create_room(session: AsyncSession, name: str, capacity: int, amenities: str = "", price: float = 0):
        new_room = Room(
            id=f"room_{uuid.uuid4().hex[:8]}",
            name=name,
            capacity=capacity,
            amenities=amenities,
            price=price
        )
        session.add(new_room)
        await session.commit()
        await session.refresh(new_room)
        return new_room
    
    @staticmethod
    async def update_room(session: AsyncSession, room_id: str, name: str = None, capacity: int = None, amenities: str = None, price: float = None):
        room = await RoomService.get_room_by_id(session, room_id)
        if not room:
            return None
        
        if name:
            room.name = name
        if capacity:
            room.capacity = capacity
        if amenities is not None:
            room.amenities = amenities
        if price is not None:
            room.price = price
        
        await session.commit()
        await session.refresh(room)
        return room
    
    @staticmethod
    async def update_room_price(session: AsyncSession, room_id: str, price: float):
        room = await RoomService.get_room_by_id(session, room_id)
        if not room:
            return None
        
        room.price = price
        await session.commit()
        await session.refresh(room)
        return room
    
    @staticmethod
    async def delete_room(session: AsyncSession, room_id: str):
        room = await RoomService.get_room_by_id(session, room_id)
        if not room:
            return False
        
        await session.delete(room)
        await session.commit()
        return True

