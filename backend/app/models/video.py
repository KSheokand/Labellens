from pydantic import BaseModel, Field


class Annotation(BaseModel):
    action_code: str
    action_label: str
    start_time: float
    end_time: float

    @property
    def duration(self) -> float:
        """Return the interval duration.

        Invalid intervals may produce a negative duration.
        They are retained so the quality layer can flag them.
        """
        return self.end_time - self.start_time


class Video(BaseModel):
    id: str
    subject: str
    scene: str
    quality: int | None = None
    relevance: int | None = None
    verified: str | None = None
    script: str | None = None
    objects: list[str] = Field(default_factory=list)
    descriptions: str | None = None
    length: float
    annotations: list[Annotation] = Field(default_factory=list)