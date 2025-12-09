from api.users import users_router
from api.rooms import rooms_router
from api.bookings import bookings_router
from api.admin import admin_router
from api.roles import roles_router

__all__ = ['users_router', 'rooms_router', 'bookings_router', 'admin_router', 'roles_router']