from pathlib import Path

import pytest

from backend.app.models.video import Annotation, Video
from backend.app.validators.charades_quality import validate_video


def make_video(
    *,
    length: float = 20.0,
    annotations: list[Annotation] | None = None,
) -> Video:
    return Video(
        id="TEST01",
        subject="S001",
        scene="Kitchen",
        quality=5,
        relevance=5,
        verified="Yes",
        script=None,
        objects=[],
        descriptions=None,
        length=length,
        annotations=annotations or [],
    )


def test_valid_annotation_has_no_quality_issue():
    video = make_video(
        annotations=[
            Annotation(
                action_code="c092",
                action_label="Test action",
                start_time=5.0,
                end_time=10.0,
            )
        ]
    )

    issues = validate_video(video)

    assert issues == []


def test_invalid_interval_is_reported():
    video = make_video(
        annotations=[
            Annotation(
                action_code="c092",
                action_label="Test action",
                start_time=10.0,
                end_time=5.0,
            )
        ]
    )

    issues = validate_video(video)

    assert len(issues) == 1
    assert issues[0].issue_type == "invalid_interval"
    assert issues[0].annotation_index == 0


def test_annotation_exceeding_video_length_is_reported():
    video = make_video(
        length=10.0,
        annotations=[
            Annotation(
                action_code="c092",
                action_label="Test action",
                start_time=5.0,
                end_time=15.0,
            )
        ],
    )

    issues = validate_video(video)

    assert len(issues) == 1
    assert issues[0].issue_type == "annotation_exceeds_video"
    assert issues[0].severity == "warning"


def test_negative_start_time_is_reported():
    video = make_video(
        annotations=[
            Annotation(
                action_code="c092",
                action_label="Test action",
                start_time=-1.0,
                end_time=5.0,
            )
        ]
    )

    issues = validate_video(video)

    assert len(issues) == 1
    assert issues[0].issue_type == "negative_start_time"
    assert issues[0].severity == "error"


def test_multiple_quality_issues_are_reported():
    video = make_video(
        length=10.0,
        annotations=[
            Annotation(
                action_code="c092",
                action_label="Test action",
                start_time=8.0,
                end_time=5.0,
            ),
            Annotation(
                action_code="c147",
                action_label="Another action",
                start_time=8.0,
                end_time=15.0,
            ),
        ],
    )

    issues = validate_video(video)

    assert len(issues) == 2
    assert issues[0].issue_type == "invalid_interval"
    assert issues[1].issue_type == "annotation_exceeds_video"