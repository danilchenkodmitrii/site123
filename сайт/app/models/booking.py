from datetime import date as date_class
from datetime import datetime as datetime_class
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from .users import UserModel
    from .rooms import RoomModel

class BookingModel(Base):
    """Модель бронирования комнаты"""
    
    __tablename__ = 'booking'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    rooms_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id"),
        nullable=False,
        index=True
    )
    date: Mapped[date_class] = mapped_column(nullable=False)
    start_time: Mapped[datetime_class] = mapped_column(nullable=False)
    end_time: Mapped[datetime_class] = mapped_column(nullable=False)
    meeting_title: Mapped[str] = mapped_column(
        String(525),
        nullable=False,
        default="Встреча"
    )

    # Связи
    user: Mapped["UserModel"] = relationship(back_populates="bookings")
    room: Mapped["RoomModel"] = relationship(back_populates="bookings")

    def __repr__(self) -> str:
        return f"BookingModel(id={self.id}, room={self.rooms_id}, date={self.date})"
