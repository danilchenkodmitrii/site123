from models import db, User, Room, Booking, Role
from datetime import datetime, timedelta
import uuid

def init_db(app):
    with app.app_context():
        db.create_all()
        init_roles()
        init_default_data()

def init_roles():
    roles = ['user', 'manager', 'admin']
    for role_name in roles:
        if not Role.query.filter_by(name=role_name).first():
            role = Role(name=role_name, description=f'{role_name.capitalize()} role')
            db.session.add(role)
    db.session.commit()

def init_default_data():
    if User.query.first() is None:
        admin_role = Role.query.filter_by(name='admin').first()
        user_role = Role.query.filter_by(name='user').first()
        
        users = [
            User(
                id='user_1',
                first_name='Алексей',
                last_name='Иванов',
                email='alex@company.com',
                password='password123',
                role_id=admin_role.id
            ),
            User(
                id='user_2',
                first_name='Мария',
                last_name='Петрова',
                email='maria@company.com',
                password='password123',
                role_id=user_role.id
            ),
            User(
                id='user_3',
                first_name='Иван',
                last_name='Сидоров',
                email='ivan@company.com',
                password='password123',
                role_id=user_role.id
            )
        ]
        db.session.add_all(users)
        db.session.commit()

    if Room.query.first() is None:
        rooms = [
            Room(
                id='room_1',
                name='Переговорная "Альфа"',
                capacity=6,
                amenities='Видеоконференция, Smart board',
                price=500
            ),
            Room(
                id='room_2',
                name='Переговорная "Бета"',
                capacity=4,
                amenities='Проектор, флипчарт',
                price=350
            ),
            Room(
                id='room_3',
                name='Переговорная "Гамма"',
                capacity=10,
                amenities='Видеоконференция, 4K экран, микрофонная система',
                price=800
            ),
            Room(
                id='room_4',
                name='Переговорная "Дельта"',
                capacity=2,
                amenities='Звукоизоляция',
                price=250
            )
        ]
        db.session.add_all(rooms)
        db.session.commit()
        
        if Booking.query.first() is None:
            today = datetime.now().date()
            demo_bookings = [
                Booking(
                    id='booking_1',
                    room_id='room_1',
                    user_id='user_2',
                    date=today,
                    start_time='09:00',
                    end_time='10:00',
                    title='Планерка отдела',
                    participants=''
                ),
                Booking(
                    id='booking_2',
                    room_id='room_1',
                    user_id='user_3',
                    date=today,
                    start_time='11:00',
                    end_time='12:30',
                    title='Презентация проекта',
                    participants=''
                )
            ]
            db.session.add_all(demo_bookings)
            db.session.commit()