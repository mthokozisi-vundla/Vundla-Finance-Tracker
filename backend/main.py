from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from schemas import Transaction, CategoryCreate, BudgetCreate
from database import get_db
from models import( Transaction as TransactionModel, Category as CategoryModel, Budget as BudgetModel)

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Welcome to Vundla Finance API"}

@app.get("/health")
def health_check():
    return {"status": "Vundla Finance API is running"}

@app.post("/transactions")
def create_transaction(
    transaction: Transaction,
    db: Session = Depends(get_db)
):
    new_transaction = TransactionModel(
        description=transaction.description,
        amount=transaction.amount,
        type=transaction.type,
        date=transaction.date,
        user_id=1,
        category_id=1
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "message": "Transaction created successfully",
        "transaction": new_transaction.id
    }


@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(TransactionModel).all()

    return transactions


@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id
    ).first()

    if transaction is None:
        return {"message": "Transaction not found"}

    return transaction


@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction_data: Transaction,
    db: Session = Depends(get_db)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id
    ).first()

    if transaction is None:
        return {"message": "Transaction not found"}

    transaction.description = transaction_data.description
    transaction.amount = transaction_data.amount
    transaction.type = transaction_data.type
    transaction.date = transaction_data.date

    db.commit()
    db.refresh(transaction)

    return {
        "message": "Transaction updated successfully",
        "transaction": transaction.id
    }


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id
    ).first()

    if transaction is None:
        return {"message": "Transaction not found"}

    db.delete(transaction)
    db.commit()

    return {
        "message": "Transaction deleted successfully"
    }


@app.post("/categories")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    new_category = CategoryModel(
        name=category.name,
        type=category.type,
        user_id=1
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "message": "Category created successfully",
        "category": new_category.id
    }


@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(CategoryModel).all()

    return categories


@app.get("/categories/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id
    ).first()

    if category is None:
        return {"message": "Category not found"}

    return category


@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id
    ).first()

    if category is None:
        return {"message": "Category not found"}

    category.name = category_data.name
    category.type = category_data.type

    db.commit()
    db.refresh(category)

    return {
        "message": "Category updated successfully",
        "category": category.id
    }


@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id
    ).first()

    if category is None:
        return {"message": "Category not found"}

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }


@app.post("/budgets")
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):
    new_budget = BudgetModel(
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        user_id=1,
        category_id=budget.category_id
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return {
        "message": "Budget created successfully",
        "budget": new_budget.id
    }


@app.get("/budgets")
def get_budgets(db: Session = Depends(get_db)):
    budgets = db.query(BudgetModel).all()

    return budgets


@app.get("/budgets/{budget_id}")
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id
    ).first()

    if budget is None:
        return {"message": "Budget not found"}

    return budget

@app.put("/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):
    existing_budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id
    ).first()

    if existing_budget is None:
        return {"message": "Budget not found"}

    existing_budget.amount = budget.amount
    existing_budget.month = budget.month
    existing_budget.year = budget.year
    existing_budget.category_id = budget.category_id

    db.commit()
    db.refresh(existing_budget)

    return {
        "message": "Budget updated successfully",
        "budget": existing_budget.id
    }

@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id
    ).first()

    if budget is None:
        return {"message": "Budget not found"}

    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully",
        "budget": budget_id
    }
