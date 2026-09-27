from fastapi import FastAPI

app = FastAPI(
    title="LabelLens API",
    description="Video Dataset Annotation Explorer & Quality Inspector",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "labellens-api",
    }
