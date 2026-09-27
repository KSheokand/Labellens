from fastapi import FastAPI

from backend.app.api.quality import router as quality_router
from backend.app.api.stats import router as stats_router
from backend.app.api.videos import router as videos_router


app = FastAPI(
    title="LabelLens API",
    description="Video Dataset Annotation Explorer & Quality Inspector",
    version="0.3.0",
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