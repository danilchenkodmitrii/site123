from sqlalchemy import Column, String, Integer, Text, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime

Base = declarative_base()

class Role(Base):
    __tablename__ = "role"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    users = relationship("User", back_populates="role")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("role.id"), default=1)
    role = relationship("Role", back_populates="users")
    created_at = Column(DateTime, default=datetime.utcnow)
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": f"{self.first_name} {self.last_name}",
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "role": self.role.name if self.role else "user",
            "createdAt": self.created_at.isoformat()
        }

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    amenities = Column(Text)
    price = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    bookings = relationship("Booking", back_populates="room", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "capacity": self.capacity,
            "amenities": self.amenities or "",
            "price": self.price,
            "createdAt": self.created_at.isoformat()
        }

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    title = Column(String(255), nullable=False)
    participants = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")

    def to_dict(self):
        participants = []
        if self.participants:
            participants = [p.strip() for p in self.participants.split(",")]

        return {
            "id": self.id,
            "roomId": self.room_id,
            "userId": self.user_id,
            "userName": self.user.first_name + " " + self.user.last_name if self.user else "",
            "date": self.date.isoformat(),
            "startTime": self.start_time,
            "endTime": self.end_time,
            "title": self.title,
            "participants": participants,
            "createdAt": self.created_at.isoformat()
        }

DATABASE_URL = "sqlite+aiosqlite:///./database/soveshchayka.db"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_roles()
    await init_default_data()

async def init_roles():
    async with async_session() as session:
        from sqlalchemy import select
        for role_name in ["user", "manager", "admin"]:
            existing = await session.execute(select(Role).where(Role.name == role_name))
            if not existing.scalar():
                role = Role(name=role_name, description=f"{role_name.capitalize()} role")
                session.add(role)
        await session.commit()

async def init_default_data():
    async with async_session() as session:
        from sqlalchemy import select
        from datetime import timedelta

        user_check = await session.execute(select(func.count(User.id)))
        if user_check.scalar() == 0:
            admin_role = await session.execute(select(Role).where(Role.name == "admin"))
            admin_role = admin_role.scalar()
            user_role = await session.execute(select(Role).where(Role.name == "user"))
            user_role = user_role.scalar()

            users = [
                User(id="user_1", first_name="Алексей", last_name="Иванов", email="alex@company.com", password="password123", role_id=admin_role.id),
                User(id="user_2", first_name="Мария", last_name="Петрова", email="maria@company.com", password="password123", role_id=user_role.id),
                User(id="user_3", first_name="Иван", last_name="Сидоров", email="ivan@company.com", password="password123", role_id=user_role.id)
            ]
            session.add_all(users)
            await session.commit()

        room_check = await session.execute(select(func.count(Room.id)))
        if room_check.scalar() == 0:
            rooms = [
                Room(id="room_1", name='Переговорная "Альфа"', capacity=6, amenities="Видеоконференция, Smart board", price=500),
                Room(id="room_2", name='Переговорная "Бета"', capacity=4, amenities="Проектор, флипчарт", price=350),
                Room(id="room_3", name='Переговорная "Гамма"', capacity=10, amenities="Видеоконференция, 4K экран, микрофонная система", price=800),
                Room(id="room_4", name='Переговорная "Дельта"', capacity=2, amenities="Звукоизоляция", price=250)
            ]
            session.add_all(rooms)
            await session.commit()

            booking_check = await session.execute(select(func.count(Booking.id)))
            if booking_check.scalar() == 0:
                today = datetime.now().date()
                bookings = [
                    Booking(id="booking_1", room_id="room_1", user_id="user_2", date=today, start_time="09:00", end_time="10:00", title="Планерка отдела", participants=""),
                    Booking(id="booking_2", room_id="room_1", user_id="user_3", date=today, start_time="11:00", end_time="12:30", title="Презентация проекта", participants="")
                ]
                session.add_all(bookings)
                await session.commit()