from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

DATABASE_URL = "sqlite:///./soveschayka.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    models.Base.metadata.create_all(bind=engine)

