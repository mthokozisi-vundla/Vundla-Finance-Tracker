
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker

from models import Base

load_dotenv()

TEST_DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username="root",
    password=os.getenv("DB_PASSWORD"),
    host="localhost",
    port=3306,
    database="vundla_finance_test"
)

test_engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
