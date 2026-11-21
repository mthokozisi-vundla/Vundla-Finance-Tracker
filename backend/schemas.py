from pydantic import BaseModel, EmailStr, Field
from datetime import date

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Transaction(BaseModel):
    description: str = Field(min_length=2, max_length=255)
    amount: float = Field(gt=0)
    category_id: int = Field(gt=0)
    type: str = Field(pattern="^(Income|Expense)$")
    date: date




class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    type: str = Field(pattern="^(Income|Expense)$")


class BudgetCreate(BaseModel):
    amount: float = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    category_id: int = Field(gt=0)
