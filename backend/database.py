from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.pool import NullPool
from typing import Optional
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketplace.db")

# Create engine with SQLite optimizations
engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={
        "timeout": 30,  # wait up to 30s for locks
        "check_same_thread": False,
    },
    poolclass=NullPool,  # close connections immediately to avoid lingering locks
    pool_pre_ping=True,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Ensure SQLite is configured for better concurrency and safety."""
    try:
        cursor = dbapi_connection.cursor()
        # Enable WAL for concurrent reads/writes and reduce writer starvation
        cursor.execute("PRAGMA journal_mode=WAL")
        # Reduce fsyncs for speed but keep reasonable durability
        cursor.execute("PRAGMA synchronous=NORMAL")
        # Ensure foreign key constraints are enforced
        cursor.execute("PRAGMA foreign_keys=ON")
        # Increase busy timeout so SQLite waits for locks instead of failing fast
        cursor.execute("PRAGMA busy_timeout=30000")  # 30 seconds
        cursor.close()
    except Exception:
        # If we're not on SQLite or something fails, ignore silently
        pass

def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
