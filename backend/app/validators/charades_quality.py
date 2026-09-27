from dataclasses import dataclass

from backend.app.models.video import Video


@dataclass
class QualityIssue:
    video_id: str
    issue_type: str
    severity: str
    message: str
    annotation_index: int | None = None


def validate_video(video: Video) -> list[QualityIssue]:
    issues: list[QualityIssue] = []

    for index, annotation in enumerate(video.annotations):
        if annotation.start_time < 0:
            issues.append(
                QualityIssue(
                    video_id=video.id,
                    issue_type="negative_start_time",
                    severity="error",
                    message=(
                        f"Annotation starts before 0s: "
                        f"{annotation.start_time}"
                    ),
                    annotation_index=index,
                )
            )

        if annotation.end_time < 0:
            issues.append(
                QualityIssue(
                    video_id=video.id,
                    issue_type="negative_end_time",
                    severity="error",
                    message=(
                        f"Annotation ends before 0s: "
                        f"{annotation.end_time}"
                    ),
                    annotation_index=index,
                )
            )

        if annotation.end_time <= annotation.start_time:
            issues.append(
                QualityIssue(
                    video_id=video.id,
                    issue_type="invalid_interval",
                    severity="error",
                    message=(
                        f"End time {annotation.end_time}s is not "
                        f"greater than start time {annotation.start_time}s"
                    ),
                    annotation_index=index,
                )
            )

        elif annotation.end_time > video.length:
            overrun = annotation.end_time - video.length

            issues.append(
                QualityIssue(
                    video_id=video.id,
                    issue_type="annotation_exceeds_video",
                    severity="warning",
                    message=(
                        f"Annotation ends at {annotation.end_time}s "
                        f"but video length is {video.length}s "
                        f"(overrun: {overrun:.2f}s)"
                    ),
                    annotation_index=index,
                )
            )

    return issues


def validate_videos(videos: list[Video]) -> list[QualityIssue]:
    issues: list[QualityIssue] = []

    for video in videos:
        issues.extend(validate_video(video))

    return issues