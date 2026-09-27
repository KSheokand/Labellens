from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from backend.app.db.models import AnnotationDB, VideoDB, VideoObjectDB


def get_videos(
    session: Session,
    *,
    search: str | None = None,
    scene: str | None = None,
    verified: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[VideoDB], int]:

    query = select(VideoDB)

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                VideoDB.id.ilike(search_pattern),
                VideoDB.subject.ilike(search_pattern),
                VideoDB.scene.ilike(search_pattern),
                VideoDB.script.ilike(search_pattern),
                VideoDB.descriptions.ilike(search_pattern),
            )
        )

    if scene:
        query = query.where(VideoDB.scene == scene)

    if verified:
        query = query.where(VideoDB.verified == verified)

    count_query = select(func.count()).select_from(query.subquery())
    total = session.scalar(count_query) or 0

    query = (
        query
        .order_by(VideoDB.id)
        .offset(offset)
        .limit(limit)
    )

    videos = list(session.scalars(query).all())

    return videos, total


def get_video(
    session: Session,
    video_id: str,
) -> VideoDB | None:

    return session.get(VideoDB, video_id)


def get_video_annotations(
    session: Session,
    video_id: str,
) -> list[AnnotationDB]:

    query = (
        select(AnnotationDB)
        .where(AnnotationDB.video_id == video_id)
        .order_by(AnnotationDB.start_time, AnnotationDB.id)
    )

    return list(session.scalars(query).all())

def get_video_objects(
    session: Session,
    video_id: str,
) -> list[str]:
    query = (
        select(VideoObjectDB.object_label)
        .where(VideoObjectDB.video_id == video_id)
        .order_by(VideoObjectDB.object_label)
    )

    return list(session.scalars(query).all())


def get_scenes(session: Session) -> list[str]:
    query = (
        select(VideoDB.scene)
        .where(VideoDB.scene.is_not(None))
        .distinct()
        .order_by(VideoDB.scene)
    )

    return list(session.scalars(query).all())