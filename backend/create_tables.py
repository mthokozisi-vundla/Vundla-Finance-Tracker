# Import the database engine and Base
from database import engine, Base

# Import all models so SQLAlchemy knows about them
from models import User, Category, Transaction, Budget

# Create all database tables
Base.metadata.create_all(bind=engine)

print("Vundla Finance tables created successfully!")