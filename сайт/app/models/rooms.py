from typing import TYPE_CHECKING
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .booking import BookingModel

class RoomModel(Base):
    __tablename__ = 'rooms'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        index=True
    )
    price_per_hour: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    equipment: Mapped[str] = mapped_column(
        String(525),
        default=""
    )

    # Связь: одна комната может быть во многих бронированиях
    bookings: Mapped[list["BookingModel"]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"RoomModel(id={self.id}, title='{self.title}', capacity={self.capacity})"