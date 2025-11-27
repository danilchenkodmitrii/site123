from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class UserModel(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    role_id = Column(Integer, ForeignKey('roles.id'))

    # Связи
    role = relationship("RoleModel", back_populates="users")
    bookings = relationship("BookingModel", back_populates="user")