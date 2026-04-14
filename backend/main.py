from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Proyecto Gondola API")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

STORAGE_BUCKET = "fotos-gondola"


# ---------- Pydantic models ----------

class VisitaUpdate(BaseModel):
    usuario_nombre: Optional[str] = None
    observaciones: Optional[str] = None
    estado: Optional[str] = None
    grupo_whatsapp: Optional[str] = None
    enviada_whatsapp: Optional[bool] = None
    fecha_finalizacion: Optional[str] = None


# ---------- Helper ----------

def get_db():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    return supabase


# ---------- Health ----------

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ---------- Cadenas ----------

@app.get("/cadenas")
async def get_cadenas():
    db = get_db()
    res = db.table("cadenas").select("*").order("nombre").execute()
    return {"data": res.data}


# ---------- Sucursales ----------

@app.get("/sucursales")
async def get_sucursales(cadena_id: Optional[int] = Query(None)):
    db = get_db()
    query = db.table("sucursales").select("*").order("nombre")
    if cadena_id:
        query = query.eq("cadena_id", cadena_id)
    res = query.execute()
    return {"data": res.data}


# ---------- Marcas ----------

@app.get("/marcas")
async def get_marcas():
    db = get_db()
    res = db.table("marcas").select("*").order("nombre").execute()
    return {"data": res.data}


# ---------- Productos ----------

@app.get("/productos")
async def get_productos(marca_id: Optional[int] = Query(None)):
    db = get_db()
    query = db.table("productos").select("*").order("nombre")
    if marca_id:
        query = query.eq("marca_id", marca_id)
    res = query.execute()
    return {"data": res.data}


# ---------- Visitas ----------

@app.post("/visitas")
async def create_visita(
    sucursal_id: int = Query(...),
    marca_id: int = Query(...),
    producto_id: int = Query(...),
):
    db = get_db()
    res = db.table("visitas").insert({
        "sucursal_id": sucursal_id,
        "marca_id": marca_id,
        "producto_id": producto_id,
        "estado": "pendiente",
        "fecha": datetime.utcnow().isoformat(),
    }).execute()
    return {"data": res.data}


@app.patch("/visitas/{visita_id}")
async def update_visita(visita_id: int, body: VisitaUpdate):
    db = get_db()
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    res = db.table("visitas").update(update_data).eq("id", visita_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    return {"data": res.data}


@app.post("/visitas/{visita_id}/finalizar")
async def finalizar_visita(visita_id: int):
    db = get_db()
    res = db.table("visitas").update({
        "estado": "finalizada",
        "fecha_finalizacion": datetime.utcnow().isoformat(),
    }).eq("id", visita_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    return {"data": res.data}


# ---------- Fotos ----------

@app.get("/fotos/{visita_id}")
async def get_fotos(visita_id: int):
    db = get_db()
    res = db.table("fotos").select("*").eq("visita_id", visita_id).order("created_at").execute()
    fotos = res.data or []

    # Attach public URLs
    for foto in fotos:
        try:
            url_res = db.storage.from_(STORAGE_BUCKET).get_public_url(foto["archivo"])
            foto["url"] = url_res
        except Exception:
            foto["url"] = None

    return {"data": fotos}


@app.post("/fotos")
async def upload_foto(visita_id: int = Query(...), file: UploadFile = File(...)):
    db = get_db()
    contents = await file.read()
    file_path = f"visita_{visita_id}/{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"

    # Upload to Supabase Storage
    try:
        db.storage.from_(STORAGE_BUCKET).upload(
            file_path,
            contents,
            {"content-type": file.content_type or "image/jpeg"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir foto: {str(e)}")

    # Save record in DB
    res = db.table("fotos").insert({
        "visita_id": visita_id,
        "archivo": file_path,
    }).execute()

    return {"data": res.data}


# ---------- Admin ----------

@app.get("/admin/visitas")
async def admin_get_visitas(
    cadena_id: Optional[int] = Query(None),
    sucursal_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
):
    db = get_db()
    query = (
        db.table("visitas")
        .select(
            "id, sucursal_id, marca_id, producto_id, usuario_nombre, observaciones, "
            "estado, fecha, fecha_finalizacion, grupo_whatsapp, enviada_whatsapp, created_at, "
            "sucursales(nombre, cadena_id, cadenas(nombre)), "
            "marcas(nombre), "
            "productos(nombre)"
        )
        .order("created_at", desc=True)
    )

    if sucursal_id:
        query = query.eq("sucursal_id", sucursal_id)
    if estado:
        query = query.eq("estado", estado)
    if fecha_desde:
        query = query.gte("fecha", fecha_desde)
    if fecha_hasta:
        query = query.lte("fecha", fecha_hasta)

    res = query.execute()
    visitas = res.data or []

    # Filter by cadena_id via sucursal join
    if cadena_id:
        visitas = [
            v for v in visitas
            if v.get("sucursales") and v["sucursales"].get("cadena_id") == cadena_id
        ]

    return {"data": visitas}


@app.get("/admin/visitas/{visita_id}/fotos")
async def admin_get_fotos(visita_id: int):
    db = get_db()
    res = db.table("fotos").select("*").eq("visita_id", visita_id).order("created_at").execute()
    fotos = res.data or []

    for foto in fotos:
        try:
            url_res = db.storage.from_(STORAGE_BUCKET).get_public_url(foto["archivo"])
            foto["url"] = url_res
        except Exception:
            foto["url"] = None

    return {"data": fotos}
