from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.api.videos import get_db
from backend.app.db.models import QualityIssueDB


router = APIRouter(
    prefix="/api/quality",
    tags=["quality"],
)


@router.get("/overview")
def quality_overview(
    db: Session = Depends(get_db),
):
    total = db.scalar(
        select(func.count()).select_from(QualityIssueDB)
    ) or 0

    errors = db.scalar(
        select(func.count())
        .select_from(QualityIssueDB)
        .where(QualityIssueDB.severity == "error")
    ) or 0

    warnings = db.scalar(
        select(func.count())
        .select_from(QualityIssueDB)
        .where(QualityIssueDB.severity == "warning")
    ) or 0

    affected_videos = db.scalar(
        select(
            func.count(
                func.distinct(QualityIssueDB.video_id)
            )
        )
    ) or 0

    return {
        "total_issues": total,
        "errors": errors,
        "warnings": warnings,
        "affected_videos": affected_videos,
    }


@router.get("/issues")
def quality_issues(
    severity: str | None = Query(default=None),
    issue_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(QualityIssueDB)

    if severity:
        query = query.where(
            QualityIssueDB.severity == severity
        )

    if issue_type:
        query = query.where(
            QualityIssueDB.issue_type == issue_type
        )

    total_query = select(
        func.count()
    ).select_from(query.subquery())

    total = db.scalar(total_query) or 0

    query = (
        query
        .order_by(QualityIssueDB.id)
        .offset(offset)
        .limit(limit)
    )

    issues = list(db.scalars(query).all())

    return {
        "items": [
            {
                "id": issue.id,
                "video_id": issue.video_id,
                "issue_type": issue.issue_type,
                "severity": issue.severity,
                "message": issue.message,
                "annotation_index": issue.annotation_index,
            }
            for issue in issues
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }