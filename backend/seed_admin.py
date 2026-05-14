"""
Run this once to create the admin user in the database.
Usage:
    cd c:\\Users\\91630\\Desktop\\gold\\backend
    .\\venv\\Scripts\\python.exe seed_admin.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

from db.models import Base, User, RoleEnum
from core.security import get_password_hash

ADMIN_EMAIL    = "admin@jl-jewellers.local"
ADMIN_PASSWORD = "Admin@2003"      # Change after first login
ADMIN_NAME     = "Jwala Lakshmi Jewellers Admin"

async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)

    # Create tables if they don't exist yet
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalars().first()

        if existing:
            print(f"✓ Admin already exists: {ADMIN_EMAIL}")
        else:
            admin = User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                business_name=ADMIN_NAME,
                role=RoleEnum.admin,
                is_active=True,
                must_change_password=False,   # Admin doesn't need forced reset
            )
            session.add(admin)
            await session.commit()
            print(f"✓ Admin user created!")
            print(f"  Email   : {ADMIN_EMAIL}")
            print(f"  Password: {ADMIN_PASSWORD}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
