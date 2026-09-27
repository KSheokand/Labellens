from pathlib import Path

from sqlalchemy import delete

from backend.app.db.database import SessionLocal, engine
from backend.app.db.models import (
    ActionClassDB,
    AnnotationDB,
    Base,
    ObjectClassDB,
    QualityIssueDB,
    VideoDB,
    VideoObjectDB
)
from backend.app.parsers.charades import CharadesParser
from backend.app.validators.charades_quality import validate_videos


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CHARADES_DIR = PROJECT_ROOT / "data" / "raw" / "charades"


def main() -> None:
    Base.metadata.create_all(engine)

    parser = CharadesParser(
        classes_file=CHARADES_DIR / "Charades_v1_classes.txt",
        object_classes_file=CHARADES_DIR / "Charades_v1_objectclasses.txt",
    )

    print("Parsing Charades training data...")
    videos = parser.parse_csv(
        CHARADES_DIR / "Charades_v1_train.csv"
    )

    print(f"Parsed videos: {len(videos)}")
    print(
        "Parsed annotations: "
        f"{sum(len(video.annotations) for video in videos)}"
    )

    print("Running quality validation...")
    quality_issues = validate_videos(videos)

    print(f"Quality issues: {len(quality_issues)}")

    with SessionLocal() as session:
        print("Clearing existing database data...")

        session.execute(delete(QualityIssueDB))
        session.execute(delete(VideoObjectDB))
        session.execute(delete(AnnotationDB))
        session.execute(delete(VideoDB))
        session.execute(delete(ActionClassDB))
        session.execute(delete(ObjectClassDB))

        print("Inserting action classes...")

        for code, label in parser.action_classes.items():
            session.add(
                ActionClassDB(
                    code=code,
                    label=label,
                )
            )

        print("Inserting object classes...")

        for code, label in parser.object_classes.items():
            session.add(
                ObjectClassDB(
                    code=code,
                    label=label,
                )
            )

        print("Inserting videos and annotations...")

        for video in videos:
            video_db = VideoDB(
                id=video.id,
                subject=video.subject,
                scene=video.scene,
                quality=video.quality,
                relevance=video.relevance,
                verified=video.verified,
                script=video.script,
                descriptions=video.descriptions,
                length=video.length,
            )

            session.add(video_db)

            for annotation in video.annotations:
                session.add(
                    AnnotationDB(
                        video_id=video.id,
                        action_code=annotation.action_code,
                        action_label=annotation.action_label,
                        start_time=annotation.start_time,
                        end_time=annotation.end_time,
                    )
                )

            for object_label in video.objects:
                session.add(
                    VideoObjectDB(
                    video_id=video.id,
                    object_label=object_label,
            )
        )

        print("Inserting quality issues...")

        for issue in quality_issues:
            session.add(
                QualityIssueDB(
                    video_id=issue.video_id,
                    issue_type=issue.issue_type,
                    severity=issue.severity,
                    message=issue.message,
                    annotation_index=issue.annotation_index,
                )
            )

        session.commit()

    print("\nIngestion complete.")
    print(f"Videos: {len(videos)}")
    print(
        "Annotations: "
        f"{sum(len(video.annotations) for video in videos)}"
    )
    print(f"Quality issues: {len(quality_issues)}")


if __name__ == "__main__":
    main()