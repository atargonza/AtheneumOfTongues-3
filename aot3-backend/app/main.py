
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import ai, media, flashcards


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Athenaeum of Tongues^3 API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["Flashcards"])


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "AoT^3 Backend is running!",
    }
