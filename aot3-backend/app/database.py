from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define your database URL (using SQLite for local development)
DATABASE_URL = "sqlite:///./translations.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class WordTranslation(Base):
    __tablename__ = "word_translations"

    id = Column(Integer, primary_key=True, index=True)
    original_word = Column(String, index=True, nullable=False)
    translated_word = Column(String, nullable=False)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()