from fastapi import APIRouter, HTTPException
from ..models import async_session
from ..repositories import BookingRepository
from datetime import datetime

bookings_router = APIRouter()

@bookings_router.get("/")
async def get_all_bookings():
    async with async_session() as session:
        bookings = await BookingRepository.get_all_bookings(session)
        return [booking.to_dict() for booking in bookings]

@bookings_router.get("/room/{room_id}")
async def get_room_bookings(room_id: str):
    async with async_session() as session:
        bookings = await BookingRepository.get_room_bookings(session, room_id)
        return [booking.to_dict() for booking in bookings]

@bookings_router.get("/user/{user_id}")
async def get_user_bookings(user_id: str):
    async with async_session() as session:
        bookings = await BookingRepository.get_user_bookings(session, user_id)
        return [booking.to_dict() for booking in bookings]

@bookings_router.post("/")
async def create_booking(data: dict):
    async with async_session() as session:
        booking = await BookingRepository.create_booking(
            session,
            data["roomId"],
            data["userId"],
            datetime.fromisoformat(data["date"]).date(),
            data["startTime"],
            data["endTime"],
            data["title"],
            data.get("participants", [])
        )
        if not booking:
            raise HTTPException(status_code=400, detail="Time slot not available")
        return booking.to_dict()

@bookings_router.get("/{booking_id}")
async def get_booking(booking_id: str):
    async with async_session() as session:
        booking = await BookingRepository.get_booking_by_id(session, booking_id)
        if booking:
            return booking.to_dict()
        raise HTTPException(status_code=404, detail="Booking not found")

@bookings_router.put("/{booking_id}")
async def update_booking(booking_id: str, data: dict):
    async with async_session() as session:
        booking = await BookingRepository.update_booking(session, booking_id, data.get("startTime"), data.get("endTime"), data.get("title"))
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking.to_dict()

@bookings_router.delete("/{booking_id}")
async def delete_booking(booking_id: str):
    async with async_session() as session:
        success = await BookingRepository.delete_booking(session, booking_id)
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"status": "Booking deleted"}