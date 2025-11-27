from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class RoleModel(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True)
    name = Column(String(50))

    # Связь: одна роль может быть у многих пользователей
    users = relationship("UserModel", back_populates="role")