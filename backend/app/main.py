from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.quality import router as quality_router
from backend.app.api.stats import router as stats_router
from backend.app.api.videos import router as videos_router


app = FastAPI(
    title="LabelLens API",
    description="Video Dataset Annotation Explorer & Quality Inspector",
    version="0.3.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "labellens-api",
    }


app.include_router(videos_router)
app.include_router(stats_router)
app.include_router(quality_router)