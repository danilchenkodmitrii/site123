from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime
from typing import List, Optional
import uuid

from app.models import Booking, Room, User
from app.schemes.booking_schema import BookingCreateSchema, BookingUpdateSchema
from app.exceptions.booking_exceptions import TimeSlotNotAvailable, BookingNotFound, InvalidBookingData
from app.repositories.booking_repository import BookingRepository

class BookingService:
    @staticmethod
    async def get_all_bookings(session: AsyncSession):
        return await BookingRepository.get_all_bookings(session)
    
    @staticmethod
    async def get_booking_by_id(session: AsyncSession, booking_id: str):
        booking = await BookingRepository.get_booking_by_id(session, booking_id)
        if not booking:
            raise BookingNotFound(f"Booking with id {booking_id} not found")
        return booking
    
    @staticmethod
    async def get_room_bookings(session: AsyncSession, room_id: str):
        # Проверяем существование комнаты
        room_result = await session.execute(select(Room).where(Room.id == room_id))
        if not room_result.scalar():
            raise InvalidBookingData(f"Room with id {room_id} not found")
        
        return await BookingRepository.get_room_bookings(session, room_id)
    
    @staticmethod
    async def get_user_bookings(session: AsyncSession, user_id: str):
        # Проверяем существование пользователя
        user_result = await session.execute(select(User).where(User.id == user_id))
        if not user_result.scalar():
            raise InvalidBookingData(f"User with id {user_id} not found")
        
        return await BookingRepository.get_user_bookings(session, user_id)
    
    @staticmethod
    async def create_booking(session: AsyncSession, booking_data: BookingCreateSchema):
        # Проверяем существование комнаты
        room_result = await session.execute(select(Room).where(Room.id == booking_data.roomId))
        room = room_result.scalar()
        if not room:
            raise InvalidBookingData(f"Room with id {booking_data.roomId} not found")
        
        # Проверяем существование пользователя
        user_result = await session.execute(select(User).where(User.id == booking_data.userId))
        user = user_result.scalar()
        if not user:
            raise InvalidBookingData(f"User with id {booking_data.userId} not found")
        
        # Проверяем доступность времени
        available = await BookingRepository.check_availability(
            session, 
            booking_data.roomId, 
            date.fromisoformat(booking_data.date), 
            booking_data.startTime, 
            booking_data.endTime
        )
        
        if not available:
            raise TimeSlotNotAvailable("The requested time slot is not available")
        
        # Валидация времени
        if booking_data.startTime >= booking_data.endTime:
            raise InvalidBookingData("End time must be after start time")
        
        # Проверяем рабочее время (например, с 8:00 до 22:00)
        start_hour = int(booking_data.startTime.split(":")[0])
        end_hour = int(booking_data.endTime.split(":")[0])
        
        if start_hour < 8 or end_hour > 22:
            raise InvalidBookingData("Bookings are allowed only between 8:00 and 22:00")
        
        # Проверяем максимальную длительность (например, 4 часа)
        start_minutes = int(booking_data.startTime.split(":")[0]) * 60 + int(booking_data.startTime.split(":")[1])
        end_minutes = int(booking_data.endTime.split(":")[0]) * 60 + int(booking_data.endTime.split(":")[1])
        duration_hours = (end_minutes - start_minutes) / 60
        
        if duration_hours > 4:
            raise InvalidBookingData("Maximum booking duration is 4 hours")
        
        # Создаем бронирование
        new_booking = Booking(
            id=f"booking_{uuid.uuid4().hex[:8]}",
            room_id=booking_data.roomId,
            user_id=booking_data.userId,
            date=date.fromisoformat(booking_data.date),
            start_time=booking_data.startTime,
            end_time=booking_data.endTime,
            title=booking_data.title,
            participants=",".join(booking_data.participants) if booking_data.participants else ""
        )
        
        session.add(new_booking)
        await session.commit()
        await session.refresh(new_booking)
        return new_booking
    
    @staticmethod
    async def update_booking(session: AsyncSession, booking_id: str, booking_data: BookingUpdateSchema):
        booking = await BookingService.get_booking_by_id(session, booking_id)
        
        # Обновляем только переданные поля
        update_data = booking_data.dict(exclude_unset=True)
        
        # Проверяем валидность времени если обновляется
        if "startTime" in update_data or "endTime" in update_data:
            start_time = update_data.get("startTime", booking.start_time)
            end_time = update_data.get("endTime", booking.end_time)
            
            if start_time >= end_time:
                raise InvalidBookingData("End time must be after start time")
        
        # Применяем обновления
        for field, value in update_data.items():
            setattr(booking, field, value)
        
        await session.commit()
        await session.refresh(booking)
        return booking
    
    @staticmethod
    async def delete_booking(session: AsyncSession, booking_id: str):
        booking = await BookingService.get_booking_by_id(session, booking_id)
        
        await session.delete(booking)
        await session.commit()
        return True
    
    @staticmethod
    async def check_availability(session: AsyncSession, room_id: str, booking_date: date, 
                               start_time: str, end_time: str):
        return await BookingRepository.check_availability(
            session, room_id, booking_date, start_time, end_time
        )