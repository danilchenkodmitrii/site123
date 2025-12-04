from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

class Settings(BaseSettings):
    """
    Настройки приложения.
    Все значения могут быть переопределены через переменные окружения или .env файл.
    """
    
    # Настройки базы данных
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///app.db"
    )
    
    # Настройки JWT (для аутентификации)
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", 
        "your-super-secret-jwt-key-change-this-in-production"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Настройки приложения
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    APP_NAME: str = os.getenv("APP_NAME", "Booking System")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    
    # Настройки безопасности
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = os.getenv(
        "BACKEND_CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:8000"
    ).split(",")
    
    # Настройки для продакшена
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
        # Пример валидации значений
        @classmethod
        def customise_sources(cls, init_settings, env_settings, file_secret_settings):
            # Приоритет: переменные окружения > .env файл > значения по умолчанию
            return (
                init_settings,
                env_settings,
                file_secret_settings,
            )

# экземпляр настроек
settings = Settings()

# Функция для получения URL базы данных (совместимость с существующим кодом)
def get_db_url() -> str:
    """Возвращает URL для подключения к базе данных."""
    return settings.DATABASE_URL

# Утилита для проверки настроек
def validate_settings():
    """Валидация настроек при запуске приложения."""
    required_vars = [
        "DATABASE_URL",
        "JWT_SECRET_KEY",
        "JWT_ALGORITHM",
    ]
    
    missing_vars = []
    for var in required_vars:
        if not getattr(settings, var, None):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(
            f"Отсутствуют обязательные настройки: {', '.join(missing_vars)}. "
            f"Пожалуйста, задайте их в .env файле или переменных окружения."
        )
    
    print(f"✅ Настройки загружены успешно!")
    print(f"   Приложение: {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"   Окружение: {settings.ENVIRONMENT}")
    print(f"   База данных: {settings.DATABASE_URL}")
    print(f"   Режим отладки: {settings.DEBUG}")

# При импорте автоматически проверяем настройки
if __name__ != "__main__":
    validate_settings()

# Для тестирования настроек
if __name__ == "__main__":
    print("=== Текущие настройки ===")
    print(f"DATABASE_URL: {settings.DATABASE_URL}")
    print(f"JWT_SECRET_KEY: {settings.JWT_SECRET_KEY[:10]}...")
    print(f"JWT_ALGORITHM: {settings.JWT_ALGORITHM}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ENVIRONMENT: {settings.ENVIRONMENT}")