
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from dotenv import load_dotenv


# Load environment variables from the backend folder
load_dotenv(Path(__file__).resolve().parent / ".env")


# Authentication settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# Make sure our secret key exists
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from the .env file")


# Create a JWT access token
def create_access_token(data: dict, expires_delta: timedelta | None = None):

    # Make a copy of the information we want to store
    to_encode = data.copy()

    # Calculate when the token should expire
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Add the expiration time to the token information
    to_encode.update({"exp": expire})

    # Sign and create the JWT token
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# Verify a JWT access token
def verify_access_token(token: str):

    try:
        # Decode and verify the token's signature and expiration
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except InvalidTokenError:
        return None
