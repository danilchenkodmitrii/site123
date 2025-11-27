from sqlalchemy import Column, Integer, ForeignKey, Date, DateTime, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class BookingModel(Base):
    __tablename__ = 'booking'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    rooms_id = Column(Integer, ForeignKey('rooms.id'))
    date = Column(Date)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    meeting_title = Column(String(525))
    # Связи
    user = relationship("UserModel", back_populates="bookings")
    room = relationship("RoomModel", back_populates="bookings")