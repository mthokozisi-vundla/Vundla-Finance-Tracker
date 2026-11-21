
def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "Vundla Finance API is running"
    }

def test_register_user(client, db):
    response = client.post(
        "/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["message"] == "Account created successfully"
    assert data["user"]["name"] == "Test User"
    assert data["user"]["email"] == "testuser@example.com"
    assert data["user"]["role"] == "User"

    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]

def test_register_duplicate_email(client):
    user_data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "TestPassword123"
    }

    # Register the user for the first time
    first_response = client.post(
        "/register",
        json=user_data
    )

    assert first_response.status_code == 201

    # Try registering with the same email again
    second_response = client.post(
        "/register",
        json=user_data
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Email address is already registered"

def test_login_user(client):
    user_data = {
        "name": "Login Test",
        "email": "login@example.com",
        "password": "LoginPassword123"
    }

    register_response = client.post(
        "/register",
        json=user_data
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    assert login_response.status_code == 200

    data = login_response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@example.com"
    assert data["user"]["name"] == "Login Test"
    assert data["user"]["role"] == "User"

def test_login_wrong_password(client):
    user_data = {
        "name": "Security Test",
        "email": "security@example.com",
        "password": "CorrectPassword123"
    }

    # Create the account
    register_response = client.post(
        "/register",
        json=user_data
    )

    assert register_response.status_code == 201

    # Try logging in with the wrong password
    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": "WrongPassword123"
        }
    )

    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Incorrect email or password"

def test_create_transaction(client):
    # Register a user
    user_data = {
        "name": "Transaction Tester",
        "email": "transaction@example.com",
        "password": "TestPassword123"
    }

    client.post("/register", json=user_data)

    # Log in
    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    token = login_response.json()["access_token"]

    # Prepare the authentication header
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create a category
    category_response = client.post(
        "/categories",
        json={
            "name": "Food",
            "type": "Expense"
        },
        headers=headers
    )

    assert category_response.status_code == 200

    category_id = category_response.json()["category"]

    # Create a transaction
    transaction_response = client.post(
        "/transactions",
        json={
            "description": "Bought groceries",
            "amount": 250.00,
            "type": "Expense",
            "date": "2026-11-21",
            "category_id": category_id
        },
        headers=headers
    )

    assert transaction_response.status_code == 200

    data = transaction_response.json()

    assert data["message"] == "Transaction created successfully"
    assert data["transaction"] is not None

def test_create_transaction_without_login(client):
    response = client.post(
        "/transactions",
        json={
            "description": "Unauthorised purchase",
            "amount": 100.00,
            "type": "Expense",
            "date": "2026-11-21",
            "category_id": 1
        }
    )

    assert response.status_code == 401

def test_transaction_cannot_use_another_users_category(client):
    # Register User A
    user_a = {
        "name": "User A",
        "email": "usera@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_a)

    # Log in User A
    login_a = client.post(
        "/login",
        json={
            "email": user_a["email"],
            "password": user_a["password"]
        }
    )

    token_a = login_a.json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    # User A creates a category
    category_response = client.post(
        "/categories",
        json={
            "name": "Personal",
            "type": "Expense"
        },
        headers=headers_a
    )

    category_id = category_response.json()["category"]

    # Register User B
    user_b = {
        "name": "User B",
        "email": "userb@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_b)

    # Log in User B
    login_b = client.post(
        "/login",
        json={
            "email": user_b["email"],
            "password": user_b["password"]
        }
    )

    token_b = login_b.json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    # User B tries to use User A's category
    response = client.post(
        "/transactions",
        json={
            "description": "Attempted unauthorised transaction",
            "amount": 100,
            "type": "Expense",
            "date": "2026-11-21",
            "category_id": category_id
        },
        headers=headers_b
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"

def test_get_user_transactions(client):
    user_data = {
        "name": "Transaction Reader",
        "email": "reader@example.com",
        "password": "Password123"
    }

    # Register the user
    client.post("/register", json=user_data)

    # Log in
    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create a category
    category_response = client.post(
        "/categories",
        json={
            "name": "Transport",
            "type": "Expense"
        },
        headers=headers
    )

    category_id = category_response.json()["category"]

    # Create a transaction
    client.post(
        "/transactions",
        json={
            "description": "Taxi fare",
            "amount": 50,
            "type": "Expense",
            "date": "2026-11-21",
            "category_id": category_id
        },
        headers=headers
    )

    # Retrieve the user's transactions
    response = client.get(
        "/transactions",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["description"] == "Taxi fare"
    assert float(data[0]["amount"]) == 50.0
    assert data[0]["type"] == "Expense"

def test_user_cannot_retrieve_another_users_transaction(client):
    # Create User A
    user_a = {
        "name": "User A",
        "email": "usera@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_a)

    # Log in User A
    login_a = client.post(
        "/login",
        json={
            "email": user_a["email"],
            "password": user_a["password"]
        }
    )

    token_a = login_a.json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    # Create a category for User A
    category_response = client.post(
        "/categories",
        json={
            "name": "Food",
            "type": "Expense"
        },
        headers=headers_a
    )

    category_id = category_response.json()["category"]

    # Create a transaction for User A
    transaction_response = client.post(
        "/transactions",
        json={
            "description": "Grocery shopping",
            "amount": 250,
            "type": "Expense",
            "date": "2026-11-21",
            "category_id": category_id
        },
        headers=headers_a
    )

    transaction_id = transaction_response.json()["transaction"]
    # Create User B
    user_b = {
        "name": "User B",
        "email": "userb@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_b)

    # Log in User B
    login_b = client.post(
        "/login",
        json={
            "email": user_b["email"],
            "password": user_b["password"]
        }
    )

    token_b = login_b.json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    # User B attempts to retrieve User A's transaction
    response = client.get(
        f"/transactions/{transaction_id}",
        headers=headers_b
    )

    # Verify access is denied
    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found"

def test_user_cannot_retrieve_another_users_category(client):
    # Create User A
    user_a = {
        "name": "User A",
        "email": "usera@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_a)

    # Log in User A
    login_a = client.post(
        "/login",
        json={
            "email": user_a["email"],
            "password": user_a["password"]
        }
    )

    token_a = login_a.json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    # Create a category for User A
    category_response = client.post(
        "/categories",
        json={
            "name": "Food",
            "type": "Expense"
        },
        headers=headers_a
    )

    category_id = category_response.json()["category"]

    # Create User B
    user_b = {
        "name": "User B",
        "email": "userb@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_b)

    # Log in User B
    login_b = client.post(
        "/login",
        json={
            "email": user_b["email"],
            "password": user_b["password"]
        }
    )

    token_b = login_b.json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    # User B attempts to retrieve User A's category
    response = client.get(
        f"/categories/{category_id}",
        headers=headers_b
    )

    # Verify access is denied
    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"

def test_user_cannot_update_another_users_category(client):
    # Create User A
    user_a = {
        "name": "User A",
        "email": "usera@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_a)

    # Log in User A
    login_a = client.post(
        "/login",
        json={
            "email": user_a["email"],
            "password": user_a["password"]
        }
    )

    token_a = login_a.json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    # Create a category for User A
    category_response = client.post(
        "/categories",
        json={
            "name": "Food",
            "type": "Expense"
        },
        headers=headers_a
    )

    category_id = category_response.json()["category"]

    # Create User B
    user_b = {
        "name": "User B",
        "email": "userb@example.com",
        "password": "Password123"
    }

    client.post("/register", json=user_b)

    # Log in User B
    login_b = client.post(
        "/login",
        json={
            "email": user_b["email"],
            "password": user_b["password"]
        }
    )

    token_b = login_b.json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    # User B attempts to update User A's category
    response = client.put(
        f"/categories/{category_id}",
        json={
            "name": "Hacked Category",
            "type": "Expense"
        },
        headers=headers_b
    )

    # Verify access is denied
    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"