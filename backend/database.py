#Import tools needed to connect to the database
from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database connection details
DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username="root",
    password=os.getenv("DB_PASSWORD"),
    host="localhost",
    port=3306,
    database="vundla_finance"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# Get a database session
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()