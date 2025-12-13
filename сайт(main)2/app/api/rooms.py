from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import traceback

from app.models import get_db
from app.services.room_service import RoomService
from app.schemes.room_schema import RoomCreateSchema
from app.exceptions.room_exceptions import RoomNotFound, InvalidRoomData
from ..models import async_session

rooms_router = APIRouter()

async def get_db():
    async with async_session() as session:
        yield session

@rooms_router.get("/")
async def get_all_rooms(db: AsyncSession = Depends(get_db)):
    try:
        print("🏢 Запрос всех комнат...")
        rooms = await RoomService.get_all_rooms(db)
        print(f"✅ Найдено {len(rooms)} комнат")
        return [room.to_dict() for room in rooms]
    except Exception as e:
        print(f"❌ Ошибка при получении комнат: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@rooms_router.get("/{room_id}")
async def get_room(room_id: str, db: AsyncSession = Depends(get_db)):
    try:
        room = await RoomService.get_room_by_id(db, room_id)
        return room.to_dict()
    except RoomNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Ошибка при получении комнаты {room_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@rooms_router.post("/")
async def create_room(data: dict):
    async with async_session() as session:
        room = await RoomService.create_room(session, data["name"], data["capacity"], data.get("amenities", ""), data.get("price", 0))
        return room.to_dict()

@rooms_router.put("/{room_id}")
async def update_room(room_id: str, data: dict):
    async with async_session() as session:
        room = await RoomService.update_room(session, room_id, data.get("name"), data.get("capacity"), data.get("amenities"), data.get("price"))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room.to_dict()

@rooms_router.put("/{room_id}/price")
async def update_room_price(room_id: str, data: dict):
    async with async_session() as session:
        room = await RoomService.update_room_price(session, room_id, data.get("price"))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room.to_dict()

@rooms_router.delete("/{room_id}")
async def delete_room(room_id: str):
    async with async_session() as session:
        success = await RoomService.delete_room(session, room_id)
        if not success:
            raise HTTPException(status_code=404, detail="Room not found")
        return {"status": "Room deleted"}