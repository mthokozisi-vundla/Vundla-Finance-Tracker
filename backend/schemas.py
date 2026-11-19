from pydantic import BaseModel
from datetime import date

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
