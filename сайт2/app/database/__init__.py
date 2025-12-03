from app.database.database import engine, Base
from app.models.roles import RoleModel
from app.models.users import UserModel
from app.models.rooms import RoomModel
from app.models.booking import BookingModel

def init_db():
    """Инициализация базы данных"""
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    
    # Создаем сессию для добавления начальных данных
    from app.database.database import SessionLocal
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже роли
        existing_roles = db.query(RoleModel).count()
        if existing_roles == 0:
            # Добавляем базовые роли
            roles = [
                RoleModel(name="admin"),
                RoleModel(name="user"),
                RoleModel(name="moderator")
            ]
            
            for role in roles:
                db.add(role)
            
            db.commit()
            print("Роли успешно добавлены!")
        else:
            print(f"В базе уже есть {existing_roles} ролей")
        
        print("База данных успешно инициализирована!")
        
    except Exception as e:
        print(f"Ошибка при инициализации БД: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()