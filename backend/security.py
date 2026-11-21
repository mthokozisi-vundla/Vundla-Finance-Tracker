from pwdlib import PasswordHash

# Create our password hashing tool
password_hasher = PasswordHash.recommended()


# Convert a plain password into a secure hash
def hash_password(password: str) -> str:
    return password_hasher.hash(password)


# Check whether a password matches its stored hash
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)