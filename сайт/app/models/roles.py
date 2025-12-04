from typing import TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .users import UserModel

class RoleModel(Base):
    __tablename__ = 'roles'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))

    # Связь: одна роль может быть у многих пользователей
    users: Mapped[list["UserModel"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"RoleModel(id={self.id}, name='{self.name}')"