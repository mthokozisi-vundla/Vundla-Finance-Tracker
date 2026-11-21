from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from schemas import UserCreate, UserLogin, Transaction, CategoryCreate, BudgetCreate
from database import get_db
from models import (
    User as UserModel,
    Transaction as TransactionModel,
    Category as CategoryModel,
    Budget as BudgetModel
)
from security import hash_password, verify_password
from auth import create_access_token, verify_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Get the token from the request
    token = credentials.credentials

    # Check whether the token is valid
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    # Get the user ID stored inside the token
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    # Find the user in the database
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in token"
        )

    user = db.query(UserModel).filter(
        UserModel.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

@app.get("/")
def home():
    return {"message": "Welcome to Vundla Finance API"}

@app.get("/health")
def health_check():
    return {"status": "Vundla Finance API is running"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check whether the email is already registered
    existing_user = db.query(UserModel).filter(
        UserModel.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered"
        )

    # Hash the user's password
    hashed_password = hash_password(user.password)

    # Create the new user
    new_user = UserModel(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role="User"
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Account created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@app.post("/login")
def login_user(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    # Find the user by email
    user = db.query(UserModel).filter(
        UserModel.email == credentials.email
    ).first()


    # Check the password
    if user is None or not verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Create an access token
    access_token = create_access_token({
        "sub": str(user.id)
    })

    # Return the login information
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@app.post("/transactions")
def create_transaction(
    transaction: Transaction,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Check whether the category exists and belongs to this user
    category = db.query(CategoryModel).filter(
        CategoryModel.id == transaction.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Create the new transaction
    new_transaction = TransactionModel(
        description=transaction.description,
        amount=transaction.amount,
        type=transaction.type,
        date=transaction.date,
        user_id=current_user.id,
        category_id=transaction.category_id
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "message": "Transaction created successfully",
        "transaction": new_transaction.id
    }



@app.get("/transactions")
def get_transactions(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transactions = db.query(TransactionModel).filter(
        TransactionModel.user_id == current_user.id
    ).all()

    return transactions


@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction_data: Transaction,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Find the transaction and check ownership
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    # Check that the new category belongs to this user
    category = db.query(CategoryModel).filter(
        CategoryModel.id == transaction_data.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Update transaction information
    transaction.description = transaction_data.description
    transaction.amount = transaction_data.amount
    transaction.type = transaction_data.type
    transaction.date = transaction_data.date
    transaction.category_id = transaction_data.category_id

    db.commit()
    db.refresh(transaction)

    return {
        "message": "Transaction updated successfully",
        "transaction": transaction.id
    }


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Find the transaction and check ownership
    transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == current_user.id
    ).first()

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    # Delete the transaction
    db.delete(transaction)
    db.commit()

    return {
        "message": "Transaction deleted successfully"
    }


@app.post("/categories")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    new_category = CategoryModel(
        name=category.name,
        type=category.type,
        user_id=current_user.id
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "message": "Category created successfully",
        "category": new_category.id
    }



@app.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    categories = db.query(CategoryModel).filter(
        CategoryModel.user_id == current_user.id
    ).all()

    return categories



@app.get("/categories/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Check whether transactions use this category
    transaction = db.query(TransactionModel).filter(
        TransactionModel.category_id == category_id
    ).first()

    if transaction is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because it has transactions"
        )

    # Check whether budgets use this category
    budget = db.query(BudgetModel).filter(
        BudgetModel.category_id == category_id
    ).first()

    if budget is not None:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because it has budgets"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }


@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = category_data.name
    category.type = category_data.type

    db.commit()
    db.refresh(category)

    return {
        "message": "Category updated successfully",
        "category": category.id
    }



@app.post("/budgets")
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Check whether the category belongs to this user
    category = db.query(CategoryModel).filter(
        CategoryModel.id == budget.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Create the budget
    new_budget = BudgetModel(
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        user_id=current_user.id,
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
def get_budgets(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    budgets = db.query(BudgetModel).filter(
        BudgetModel.user_id == current_user.id
    ).all()

    return budgets

@app.get("/budgets/{budget_id}")
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    return budget

@app.put("/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Find the budget and check ownership
    existing_budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if existing_budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    # Check whether the new category belongs to this user
    category = db.query(CategoryModel).filter(
        CategoryModel.id == budget.category_id,
        CategoryModel.user_id == current_user.id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Update the budget
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
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Find the budget and check ownership
    budget = db.query(BudgetModel).filter(
        BudgetModel.id == budget_id,
        BudgetModel.user_id == current_user.id
    ).first()

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    # Delete the budget
    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully",
        "budget": budget_id
    } 