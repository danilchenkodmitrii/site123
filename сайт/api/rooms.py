from fastapi import APIRouter, HTTPException
from models import async_session
from repositories import RoomRepository

rooms_router = APIRouter()

@rooms_router.get("/")
async def get_all_rooms():
    async with async_session() as session:
        rooms = await RoomRepository.get_all_rooms(session)
        return [room.to_dict() for room in rooms]

@rooms_router.get("/{room_id}")
async def get_room(room_id: str):
    async with async_session() as session:
        room = await RoomRepository.get_room_by_id(session, room_id)
        if room:
            return room.to_dict()
        raise HTTPException(status_code=404, detail="Room not found")

@rooms_router.post("/")
async def create_room(data: dict):
    async with async_session() as session:
        room = await RoomRepository.create_room(session, data["name"], data["capacity"], data.get("amenities", ""), data.get("price", 0))
        return room.to_dict()

@rooms_router.put("/{room_id}")
async def update_room(room_id: str, data: dict):
    async with async_session() as session:
        room = await RoomRepository.update_room(session, room_id, data.get("name"), data.get("capacity"), data.get("amenities"), data.get("price"))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room.to_dict()

@rooms_router.put("/{room_id}/price")
async def update_room_price(room_id: str, data: dict):
    async with async_session() as session:
        room = await RoomRepository.update_room_price(session, room_id, data.get("price"))
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room.to_dict()

@rooms_router.delete("/{room_id}")
async def delete_room(room_id: str):
    async with async_session() as session:
        success = await RoomRepository.delete_room(session, room_id)
        if not success:
            raise HTTPException(status_code=404, detail="Room not found")
        return {"status": "Room deleted"}