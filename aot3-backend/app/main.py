from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai, media

app = FastAPI(title="Athenaeum of Tongues^3 API")

# Enable CORS so the Frontend Dev (Next.js) can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/")
def read_root():
    return {"status": "ok", "message": "AoT^3 Backend is running!"}
