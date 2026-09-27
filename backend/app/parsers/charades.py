import csv
from pathlib import Path

from backend.app.models.video import Annotation, Video


class CharadesParser:
    """Parser for the Charades dataset annotation format."""

    def __init__(
        self,
        classes_file: str | Path,
        object_classes_file: str | Path | None = None,
    ):
        self.classes_file = Path(classes_file)
        self.object_classes_file = (
            Path(object_classes_file)
            if object_classes_file
            else None
        )

        self.action_classes = self._load_classes(
            self.classes_file,
            expected_prefix="c",
        )

        self.object_classes = {}

        if self.object_classes_file:
            self.object_classes = self._load_classes(
                self.object_classes_file,
                expected_prefix="o",
            )

    @staticmethod
    def _load_classes(
        path: Path,
        expected_prefix: str,
    ) -> dict[str, str]:
        """Load class definitions such as:
        c008 Opening a door
        o012 door
        """

        classes = {}

        with path.open("r", encoding="utf-8") as file:
            for line_number, line in enumerate(file, start=1):
                line = line.strip()

                if not line:
                    continue

                parts = line.split(maxsplit=1)

                if len(parts) != 2:
                    raise ValueError(
                        f"Invalid class definition at "
                        f"{path}:{line_number}: {line}"
                    )

                code, label = parts

                if not code.startswith(expected_prefix):
                    raise ValueError(
                        f"Unexpected class code '{code}' in {path}. "
                        f"Expected prefix '{expected_prefix}'."
                    )

                classes[code] = label

        return classes

    def parse_actions(self, actions_text: str) -> list[Annotation]:
        """Parse the Charades action field.

        Example:
            c092 11.90 21.20;c147 0.00 12.60
        """

        if not actions_text or not actions_text.strip():
            return []

        annotations = []

        for item in actions_text.split(";"):
            item = item.strip()

            if not item:
                continue

            parts = item.split()

            if len(parts) != 3:
                raise ValueError(
                    f"Invalid action annotation: '{item}'"
                )

            action_code, start_text, end_text = parts

            if action_code not in self.action_classes:
                raise ValueError(
                    f"Unknown action code: '{action_code}'"
                )

            start_time = float(start_text)
            end_time = float(end_text)

            if start_time < 0:
                raise ValueError(
                    f"Negative start time: {start_time}"
                )

            annotations.append(
                Annotation(
                    action_code=action_code,
                    action_label=self.action_classes[action_code],
                    start_time=start_time,
                    end_time=end_time,
                )
            )

        return annotations

    @staticmethod
    def parse_objects(objects_text: str) -> list[str]:
        """Parse semicolon-separated object labels."""

        if not objects_text or not objects_text.strip():
            return []

        return [
            item.strip()
            for item in objects_text.split(";")
            if item.strip()
        ]

    def parse_row(self, row: dict[str, str]) -> Video:
        """Convert one Charades CSV row into a normalized Video."""

        return Video(
            id=row["id"].strip(),
            subject=row["subject"].strip(),
            scene=row["scene"].strip(),
            quality=int(row["quality"]) if row["quality"] else None,
            relevance=int(row["relevance"]) if row["relevance"] else None,
            verified=row["verified"].strip() or None,
            script=row["script"].strip() or None,
            objects=self.parse_objects(row["objects"]),
            descriptions=row["descriptions"].strip() or None,
            length=float(row["length"]),
            annotations=self.parse_actions(row["actions"]),
        )

    def parse_csv(
        self,
        csv_path: str | Path,
    ) -> list[Video]:
        """Parse an entire Charades CSV file."""

        csv_path = Path(csv_path)
        videos = []

        with csv_path.open(
            "r",
            encoding="utf-8",
            newline="",
        ) as file:
            reader = csv.DictReader(file)

            required_columns = {
                "id",
                "subject",
                "scene",
                "quality",
                "relevance",
                "verified",
                "script",
                "objects",
                "descriptions",
                "actions",
                "length",
            }

            actual_columns = set(reader.fieldnames or [])

            missing_columns = required_columns - actual_columns

            if missing_columns:
                raise ValueError(
                    f"Missing required columns: "
                    f"{sorted(missing_columns)}"
                )

            for row_number, row in enumerate(reader, start=2):
                try:
                    videos.append(self.parse_row(row))
                except Exception as exc:
                    raise ValueError(
                        f"Failed to parse {csv_path} "
                        f"at row {row_number}: {exc}"
                    ) from exc

        return videos
