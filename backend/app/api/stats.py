from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.api.videos import get_db
from backend.app.services.stats_service import (
    get_action_frequency,
    get_overview_stats,
    get_scene_distribution,
)


router = APIRouter(
    prefix="/api/stats",
    tags=["stats"],
)


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
):
    return get_overview_stats(db)


@router.get("/actions")
def action_frequency(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return {
        "items": get_action_frequency(
            db,
            limit=limit,
        )
    }


@router.get("/scenes")
def scene_distribution(
    db: Session = Depends(get_db),
):
    return {
        "items": get_scene_distribution(db)
    }