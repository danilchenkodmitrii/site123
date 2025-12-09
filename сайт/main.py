from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from models import init_db
from api import users_router, rooms_router, bookings_router, admin_router, roles_router
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/icons", StaticFiles(directory="icons"), name="icons")

app.include_router(users_router, prefix="/api/users")
app.include_router(rooms_router, prefix="/api/rooms")
app.include_router(bookings_router, prefix="/api/bookings")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(roles_router, prefix="/api/roles")

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def serve_index():
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    index_path = os.path.join(templates_dir, "index.html")
    return FileResponse(index_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

