from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import User, Role
import uuid

class UserService:
    @staticmethod
    async def get_all_users(session: AsyncSession):
        result = await session.execute(select(User))
        return result.scalars().all()
    
    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: str):
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar()
    
    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str):
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar()
    
    @staticmethod
    async def create_user(session: AsyncSession, first_name: str, last_name: str, email: str, password: str):
        existing = await UserService.get_user_by_email(session, email)
        if existing:
            return None
        
        user_role = await session.execute(select(Role).where(Role.name == "user"))
        role = user_role.scalar()
        
        new_user = User(
            id=f"user_{uuid.uuid4().hex[:8]}",
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            role_id=role.id
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user
    
    @staticmethod
    async def update_user_role(session: AsyncSession, user_id: str, role_name: str):
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return None
        
        role = await session.execute(select(Role).where(Role.name == role_name))
        role_obj = role.scalar()
        if not role_obj:
            return None
        
        user.role_id = role_obj.id
        await session.commit()
        await session.refresh(user)
        return user
    
    @staticmethod
    async def delete_user(session: AsyncSession, user_id: str):
        user = await UserService.get_user_by_id(session, user_id)
        if not user:
            return False
        
        await session.delete(user)
        await session.commit()
        return True

