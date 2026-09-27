from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.db.models import (
    ActionClassDB,
    AnnotationDB,
    ObjectClassDB,
    VideoDB,
)


def get_overview_stats(session: Session) -> dict:
    video_count = session.scalar(
        select(func.count()).select_from(VideoDB)
    ) or 0

    annotation_count = session.scalar(
        select(func.count()).select_from(AnnotationDB)
    ) or 0

    action_class_count = session.scalar(
        select(func.count()).select_from(ActionClassDB)
    ) or 0

    object_class_count = session.scalar(
        select(func.count()).select_from(ObjectClassDB)
    ) or 0

    average_video_length = session.scalar(
        select(func.avg(VideoDB.length))
    ) or 0

    average_annotations_per_video = (
        annotation_count / video_count
        if video_count
        else 0
    )

    return {
        "videos": video_count,
        "annotations": annotation_count,
        "action_classes": action_class_count,
        "object_classes": object_class_count,
        "average_video_length": round(
            float(average_video_length),
            2,
        ),
        "average_annotations_per_video": round(
            average_annotations_per_video,
            2,
        ),
    }


def get_action_frequency(
    session: Session,
    limit: int = 10,
) -> list[dict]:
    query = (
        select(
            AnnotationDB.action_code,
            AnnotationDB.action_label,
            func.count(AnnotationDB.id).label("count"),
        )
        .group_by(
            AnnotationDB.action_code,
            AnnotationDB.action_label,
        )
        .order_by(func.count(AnnotationDB.id).desc())
        .limit(limit)
    )

    return [
        {
            "action_code": row.action_code,
            "action_label": row.action_label,
            "count": row.count,
        }
        for row in session.execute(query)
    ]


def get_scene_distribution(
    session: Session,
) -> list[dict]:
    query = (
        select(
            VideoDB.scene,
            func.count(VideoDB.id).label("count"),
        )
        .group_by(VideoDB.scene)
        .order_by(func.count(VideoDB.id).desc())
    )

    return [
        {
            "scene": row.scene,
            "count": row.count,
        }
        for row in session.execute(query)
    ]