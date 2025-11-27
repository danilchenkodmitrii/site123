from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class RoomModel(Base):
    __tablename__ = 'rooms'

    id = Column(Integer, primary_key=True)
    title = Column(String(50))
    price_per_hour = Column(Integer)
    capacity = Column(Integer)
    equipment = Column(String(525))

    # Связь: одна комната может быть во многих бронированиях
    bookings = relationship("BookingModel", back_populates="room")