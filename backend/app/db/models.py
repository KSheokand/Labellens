from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class VideoDB(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    subject: Mapped[str] = mapped_column(String(20), nullable=False)
    scene: Mapped[str] = mapped_column(String(100), nullable=False)

    quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    relevance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verified: Mapped[str | None] = mapped_column(String(20), nullable=True)

    script: Mapped[str | None] = mapped_column(Text, nullable=True)
    descriptions: Mapped[str | None] = mapped_column(Text, nullable=True)

    length: Mapped[float] = mapped_column(Float, nullable=False)

    annotations: Mapped[list["AnnotationDB"]] = relationship(
        back_populates="video",
        cascade="all, delete-orphan",
    )


class AnnotationDB(Base):
    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    video_id: Mapped[str] = mapped_column(
        ForeignKey("videos.id"),
        nullable=False,
        index=True,
    )

    action_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    action_label: Mapped[str] = mapped_column(String(200), nullable=False)

    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)

    video: Mapped["VideoDB"] = relationship(
        back_populates="annotations"
    )

class VideoObjectDB(Base):
    __tablename__ = "video_objects"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    video_id: Mapped[str] = mapped_column(
        ForeignKey("videos.id"),
        nullable=False,
        index=True,
    )

    object_label: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

class ActionClassDB(Base):
    __tablename__ = "action_classes"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)


class ObjectClassDB(Base):
    __tablename__ = "object_classes"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)


class QualityIssueDB(Base):
    __tablename__ = "quality_issues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    video_id: Mapped[str] = mapped_column(
        ForeignKey("videos.id"),
        nullable=False,
        index=True,
    )

    issue_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    annotation_index: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )