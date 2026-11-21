from pydantic import BaseModel, EmailStr, Field
from datetime import date

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)

class Transaction(BaseModel):
    description:str
    amount:float
    category:str
    type:str
    date:date



class CategoryCreate(BaseModel):
    name: str
    type: str



class BudgetCreate(BaseModel):
    amount: float
    month: int
    year: int
    category_id: int
