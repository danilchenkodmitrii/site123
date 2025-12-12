"""
Пакет приложения Совещайка
"""

from .api import users_router, rooms_router, bookings_router, admin_router, roles_router
from .models import init_db

__all__ = [
    'users_router',
    'rooms_router', 
    'bookings_router',
    'admin_router',
    'roles_router',
    'init_db'
]