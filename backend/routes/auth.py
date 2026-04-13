from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

router = APIRouter()

# Dummy database for demonstration
fake_users_db = {
    "user@example.com": {
        "username": "user",
        "full_name": "John Doe",
        "email": "user@example.com",
        "hashed_password": "fakehashedsecret",
        "disabled": False,
    }
}

class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post('/register/', response_model=User)
async def register(user: UserInDB):
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password and store user in the database (dummy implementation)
    fake_users_db[user.email] = {"username": user.username, "hashed_password": "hashed_password"}
    return user

@router.post('/token', response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)
    if not user or not user['hashed_password']:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    return {"access_token": user['username'], "token_type": "bearer"}
