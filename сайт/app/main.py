from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
import database
import models

# Initialize FastAPI app
app = FastAPI(title="Soveschayka API", version="1.0.0")

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
database.init_db()

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str

class UserUpdate(BaseModel):
    role: str

class User(BaseModel):
    id: int
    name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

class RoomCreate(BaseModel):
    name: str
    capacity: int
    amenities: Optional[str] = None
    price: float

class Room(BaseModel):
    id: int
    name: str
    capacity: int
    amenities: Optional[str]
    price: float
    
    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    room_id: int
    date: str
    start_time: str
    end_time: str
    title: str
    participants: Optional[List[str]] = None

class Booking(BaseModel):
    id: int
    room_id: int
    user_id: int
    date: str
    start_time: str
    end_time: str
    title: str
    participants: Optional[List[str]]
    user_name: str
    
    class Config:
        from_attributes = True

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Users endpoints
@app.post("/api/users", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = models.User(name=user.name, email=user.email, role="user")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users", response_model=List[User])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.role = user.role
    db.commit()
    db.refresh(db_user)
    return db_user

# Rooms endpoints
@app.post("/api/rooms", response_model=Room)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    new_room = models.Room(
        name=room.name,
        capacity=room.capacity,
        amenities=room.amenities,
        price=room.price
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.get("/api/rooms/{room_id}", response_model=Room)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.get("/api/rooms", response_model=List[Room])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()

@app.put("/api/rooms/{room_id}", response_model=Room)
def update_room(room_id: int, room: RoomCreate, db: Session = Depends(get_db)):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db_room.name = room.name
    db_room.capacity = room.capacity
    db_room.amenities = room.amenities
    db_room.price = room.price
    db.commit()
    db.refresh(db_room)
    return db_room

@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(db_room)
    db.commit()
    return {"message": "Room deleted"}

# Bookings endpoints
@app.post("/api/bookings", response_model=Booking)
def create_booking(booking: BookingCreate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    room = db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check for conflicts
    conflicts = db.query(models.Booking).filter(
        models.Booking.room_id == booking.room_id,
        models.Booking.date == booking.date,
        models.Booking.start_time < booking.end_time,
        models.Booking.end_time > booking.start_time
    ).first()
    
    if conflicts:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    new_booking = models.Booking(
        room_id=booking.room_id,
        user_id=user_id,
        date=booking.date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        title=booking.title,
        participants=",".join(booking.participants) if booking.participants else None,
        user_name=user.name
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.get("/api/bookings/{booking_id}", response_model=Booking)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@app.get("/api/bookings", response_model=List[Booking])
def list_bookings(room_id: Optional[int] = None, date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Booking)
    if room_id:
        query = query.filter(models.Booking.room_id == room_id)
    if date:
        query = query.filter(models.Booking.date == date)
    return query.all()

@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted"}

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)