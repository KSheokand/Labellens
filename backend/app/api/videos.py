from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.services.video_service import (
    get_scenes,
    get_video,
    get_video_annotations,
    get_video_objects,
    get_videos,
)


router = APIRouter(
    prefix="/api/videos",
    tags=["videos"],
)


def get_db():
    with SessionLocal() as session:
        yield session


@router.get("")
def list_videos(
    search: str | None = Query(default=None),
    scene: str | None = Query(default=None),
    verified: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    videos, total = get_videos(
        db,
        search=search,
        scene=scene,
        verified=verified,
        limit=limit,
        offset=offset,
    )

    return {
        "items": [
            {
                "id": video.id,
                "subject": video.subject,
                "scene": video.scene,
                "quality": video.quality,
                "relevance": video.relevance,
                "verified": video.verified,
                "length": video.length,
                "annotation_count": len(video.annotations),
            }
            for video in videos
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/scenes")
def list_scenes(
    db: Session = Depends(get_db),
):
    return {
        "items": get_scenes(db),
    }


@router.get("/{video_id}")
def video_detail(
    video_id: str,
    db: Session = Depends(get_db),
):
    video = get_video(db, video_id)

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    annotations = get_video_annotations(db, video_id)

    return {
        "id": video.id,
        "subject": video.subject,
        "scene": video.scene,
        "quality": video.quality,
        "relevance": video.relevance,
        "verified": video.verified,
        "script": video.script,
        "objects": get_video_objects(db, video_id),
        "descriptions": video.descriptions,
        "length": video.length,
        "annotations": [
            {
                "id": annotation.id,
                "action_code": annotation.action_code,
                "action_label": annotation.action_label,
                "start_time": annotation.start_time,
                "end_time": annotation.end_time,
                "duration": (
                    annotation.end_time -
                    annotation.start_time
                ),
            }
            for annotation in annotations
        ],
    }