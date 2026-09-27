from pathlib import Path

import pytest

from backend.app.parsers.charades import CharadesParser


DATA_DIR = Path("data/raw/charades")


@pytest.fixture
def parser():
    return CharadesParser(
        classes_file=DATA_DIR / "Charades_v1_classes.txt",
        object_classes_file=DATA_DIR / "Charades_v1_objectclasses.txt",
    )


def test_action_classes_loaded(parser):
    assert len(parser.action_classes) == 157
    assert "c008" in parser.action_classes
    assert parser.action_classes["c008"] == "Opening a door"


def test_object_classes_loaded(parser):
    assert "o001" in parser.object_classes
    assert parser.object_classes["o001"] == "bag"


def test_parse_actions(parser):
    annotations = parser.parse_actions(
        "c092 11.90 21.20;c147 0.00 12.60"
    )

    assert len(annotations) == 2

    assert annotations[0].action_code == "c092"
    assert annotations[0].start_time == 11.90
    assert annotations[0].end_time == 21.20
    assert annotations[0].duration == pytest.approx(9.30)

    assert annotations[1].action_code == "c147"
    assert annotations[1].start_time == 0.0
    assert annotations[1].end_time == 12.60


def test_parse_objects(parser):
    objects = parser.parse_objects(
        "food;stove;window"
    )

    assert objects == [
        "food",
        "stove",
        "window",
    ]


def test_parse_first_training_video(parser):
    csv_path = DATA_DIR / "Charades_v1_train.csv"

    videos = parser.parse_csv(csv_path)

    assert len(videos) > 0

    video = videos[0]

    assert video.id == "46GP8"
    assert video.scene == "Kitchen"
    assert video.length == pytest.approx(24.83)

    assert len(video.annotations) == 2

    assert video.annotations[0].action_code == "c092"
    assert video.annotations[1].action_code == "c147"


def test_invalid_action_code(parser):
    with pytest.raises(ValueError):
        parser.parse_actions(
            "c999 0.0 2.0"
        )


def test_invalid_interval_is_preserved(parser):
    annotations = parser.parse_actions(
        "c092 10.0 5.0"
    )

    assert len(annotations) == 1
    assert annotations[0].start_time == 10.0
    assert annotations[0].end_time == 5.0
    assert annotations[0].duration == -5.0
