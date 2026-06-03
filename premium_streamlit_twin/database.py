import os
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Self-contained local SQLite database file path
DATABASE_URL = "sqlite+aiosqlite:///./data/plant_data.db"

# Create local data/ directory if it doesn't exist
os.makedirs("./data", exist_ok=True)

Base = declarative_base()

class ProcessTelemetry(Base):
    __tablename__ = "process_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    stage_id = Column(String(50), index=True)
    parameter = Column(String(50), index=True)
    value = Column(Float)

# Configure async engine with check_same_thread=False for SQLite multithreaded access
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False}
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    """Initializes SQLite database schema and tables asynchronously."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def log_telemetry(stage_id: str, parameter: str, value: float):
    """Logs a single sensor telemetry reading asynchronously."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            telemetry = ProcessTelemetry(
                stage_id=stage_id,
                parameter=parameter,
                value=float(value)
            )
            session.add(telemetry)
