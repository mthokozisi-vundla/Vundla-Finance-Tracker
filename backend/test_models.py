# Import all database models
from models import User, Category, Transaction, Budget

# Import SQLAlchemy relationship checker
from sqlalchemy.orm import configure_mappers

# Check whether all relationships are configured correctly
configure_mappers()

print("All four models and their relationships are working!")