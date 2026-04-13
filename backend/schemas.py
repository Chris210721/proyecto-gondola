from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    name: str
    email: EmailStr

class Tienda(BaseModel):
    id: int
    nombre: str
    direccion: str

class Marca(BaseModel):
    id: int
    nombre: str

class Tipo(BaseModel):
    id: int
    descripcion: str

class Gondola(BaseModel):
    id: int
    nombre: str
    tienda_id: int

class Comparativa(BaseModel):
    id: int
    producto_id: int
    tienda_id: int
    precio: float
    fecha: str  # Assuming date is in string format
