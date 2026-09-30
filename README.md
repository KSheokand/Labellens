# LabelLens

### Video Annotation Explorer & Quality Inspector

LabelLens is a small internal-style dataset tooling application built around the
**Charades video action dataset**. It parses existing temporal annotations,
normalizes them into a queryable SQLite database, validates annotation quality,
and provides a web interface for exploring videos, actions, scenes, and data
quality issues.

The goal is to demonstrate a practical annotation/data-inspection workflow
rather than build a general-purpose labeling platform.

---

## Summary Card

| Section | What was built | Confidence | Relevant files |
|---|---|---:|---|
| Dataset | Charades video dataset with existing temporal action annotations | 5/5 | `data/raw/charades/README.md` |
| Parser | CSV + action/class/object label parsing | 5/5 | `backend/app/parsers/charades.py` |
| Data model | Normalized videos, annotations, objects, classes and quality issues | 5/5 | `backend/app/db/models.py` |
| Quality validation | Invalid intervals and annotations exceeding video duration | 5/5 | `backend/app/validators/charades_quality.py` |
| Ingestion | Charades annotations → SQLite | 5/5 | `scripts/ingest_charades.py` |
| API | Video, statistics and quality inspection endpoints | 5/5 | `backend/app/api/` |
| UI | Dashboard, video explorer, video detail and quality inspector | 5/5 | `frontend/app/` |
| Search/filter | Video ID/text search, scene filtering and quality severity filtering | 5/5 | `frontend/app/videos/`, `frontend/app/quality/` |
| Testing | Parser, quality and API tests | 5/5 | `backend/tests/` |
| Local execution | Reproducible setup and run scripts | 5/5 | `setup.sh`, `run.sh` |

---

## 1. Overview

LabelLens takes an existing labeled video dataset and turns its annotation
format into a small, usable data-inspection tool.

The workflow is:

```text
Charades annotation files
        │
        ▼
   CharadesParser
        │
        ▼
   Quality validation
        │
        ▼
     SQLite DB
        │
        ▼
     FastAPI
        │
        ▼
    Next.js UI
        │
        ├── Dashboard
        ├── Video Explorer
        ├── Video Detail
        └── Quality Inspector
````

The application focuses on a realistic annotation-tooling problem:

> Given an existing labeled video dataset, can an engineer quickly inspect
> its labels, metadata, temporal annotations and obvious data-quality issues?

---

## 2. Dataset Choice

### Charades

The project uses the **Charades** dataset, a video dataset of indoor daily
activities with existing temporal action annotations.

Charades was selected because:

* it is a publicly available video dataset;
* annotations already exist, so no manual labeling was required;
* actions are represented as temporal intervals;
* each video contains useful metadata such as scene, subject, quality,
  relevance and verification;
* the action vocabulary provides a realistic label-classification problem;
* the temporal format makes it possible to build a meaningful quality
  inspection view.

The original dataset documentation describes:

* `Charades_v1_train.csv` as the training annotations;
* `Charades_v1_test.csv` as the testing annotations;
* `Charades_v1_classes.txt` as the action class mapping;
* `Charades_v1_objectclasses.txt` as the object class mapping.

The CSV contains fields including video ID, subject, scene, quality,
relevance, verification, script, objects, descriptions, actions and video
length.

The action field uses entries of the form:

```text
c092 11.90 21.20;c147 0.00 12.60
```

where each action contains:

```text
action_code start_time end_time
```

The project uses these existing annotations directly.

Dataset documentation and file structure were cross-checked against public
Charades dataset resources.

---

## 3. Dataset Files

Place the following files under:

```text
data/raw/charades/
```

Required files:

```text
Charades_v1_train.csv
Charades_v1_classes.txt
Charades_v1_objectclasses.txt
```

The test annotation file can also be stored there:

```text
Charades_v1_test.csv
```

Raw dataset files are intentionally **not committed to Git**.

The repository contains a small:

```text
data/raw/charades/README.md
```

describing the expected raw files.

This keeps the Git repository lightweight while allowing the application to
reconstruct the local dataset database.

---

## 4. What LabelLens Does

### Dashboard

The dashboard provides a high-level view of the ingested dataset, including:

* number of videos;
* number of temporal annotations;
* number of action classes;
* number of object classes;
* average video duration;
* average annotations per video;
* action distribution;
* scene distribution.

### Video Explorer

The video explorer supports:

* video ID/text search;
* scene filtering;
* pagination;
* video metadata inspection.

### Video Detail

A video detail page displays:

* video ID;
* subject;
* scene;
* quality;
* relevance;
* verification status;
* script;
* objects;
* descriptions;
* temporal action annotations.

Temporal annotations are visualized on a timeline.

### Quality Inspector

The quality inspector surfaces annotation problems detected during ingestion.

Current checks include:

1. **Invalid interval**

   * annotation end time is less than or equal to its start time.

2. **Annotation exceeds video**

   * annotation end time extends beyond the recorded video duration.

Quality issues are classified as:

```text
error
warning
```

The UI supports severity filtering and pagination.

---

## 5. Quality Validation

A key design decision is that the parser does **not silently discard malformed
annotations**.

Instead:

```text
Raw annotation
      │
      ▼
Parse
      │
      ▼
Preserve source values
      │
      ▼
Validate
      │
      ├── valid
      └── quality issue
```

For example, if an annotation contains:

```text
start = 18.0
end   = 10.0
```

the parser preserves the source interval while the validator reports it as an
invalid interval.

This makes the tool useful for data inspection because the original source
information remains available while problems are explicitly surfaced.

Similarly, if:

```text
video length = 31.38
annotation end = 32.00
```

the annotation is retained and reported as exceeding the video duration.

---

## 6. Current Ingested Dataset Statistics

The training annotation file currently used by the application produces:

```text
Videos:                    7,985
Annotations:              49,809
Action classes:              157
Object classes:               38
Average video length:      29.89 seconds
Average annotations/video:  6.24
```

Quality validation currently reports:

```text
Total quality issues: 14,598
Errors:                    7
Warnings:             14,591
Affected videos:       5,896
```

The dominant warning is:

```text
annotation_exceeds_video
```

The application intentionally presents these findings as dataset-quality
signals rather than automatically modifying the source annotations.

---

## 7. Architecture

### Backend

The backend is implemented using:

* Python 3
* FastAPI
* SQLAlchemy
* SQLite
* Pydantic
* pytest

Structure:

```text
backend/
├── app/
│   ├── api/
│   │   ├── quality.py
│   │   ├── stats.py
│   │   └── videos.py
│   ├── db/
│   │   ├── database.py
│   │   └── models.py
│   ├── models/
│   │   └── video.py
│   ├── parsers/
│   │   └── charades.py
│   ├── services/
│   │   ├── stats_service.py
│   │   └── video_service.py
│   └── validators/
│       └── charades_quality.py
└── tests/
```

### Frontend

The frontend uses:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Lucide React

Structure:

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── quality/
│   │   └── page.tsx
│   └── videos/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
└── src/
    └── lib/
        └── api.ts
```

---

## 8. API

The FastAPI backend exposes the following main endpoints.

### Health

```text
GET /health
```

### Videos

```text
GET /api/videos
GET /api/videos/{video_id}
GET /api/videos/scenes
```

Video listing supports search, scene filtering, pagination and limits.

### Statistics

```text
GET /api/stats/overview
GET /api/stats/actions
GET /api/stats/scenes
```

### Quality

```text
GET /api/quality/overview
GET /api/quality/issues
GET /api/quality/breakdown
```

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

## 9. Local Setup

### Prerequisites

The project requires:

* Bash
* Python 3
* Node.js
* npm
* curl

Node.js is required because the UI is implemented using Next.js.

### 1. Obtain the repository

```bash
git clone <repository-url>
cd labellens
```

### 2. Add Charades annotations

Place:

```text
Charades_v1_train.csv
Charades_v1_classes.txt
Charades_v1_objectclasses.txt
```

under:

```text
data/raw/charades/
```

The dataset itself is not included in Git.

### 3. Run setup

```bash
./setup.sh
```

The setup script:

1. verifies Python;
2. creates `.venv` if necessary;
3. installs backend dependencies;
4. verifies Node.js/npm;
5. installs frontend dependencies using `npm ci`;
6. detects the Charades annotation files;
7. ingests the dataset into SQLite when the files are available.

If the dataset files are not present, setup completes with a warning and skips
ingestion.

### 4. Start the application

```bash
./run.sh
```

The application starts:

```text
Dashboard: http://localhost:3000
API:       http://127.0.0.1:8000
API Docs:  http://127.0.0.1:8000/docs
```

Press:

```text
Ctrl+C
```

to stop both processes.

---

## 10. Database

The application uses SQLite for the local data store.

The database is generated during ingestion and is intentionally excluded from
Git.

The normalized data model contains:

```text
Video
 ├── Annotation
 └── VideoObject

ActionClass

ObjectClass

QualityIssue
```

This keeps the application simple while supporting filtering, aggregation and
quality inspection without requiring an external database service.

---

## 11. Testing

The backend test suite covers:

* Charades parsing;
* temporal annotation handling;
* invalid interval preservation;
* quality validation;
* API endpoints.

Current test result:

```text
21 passed
```

Frontend validation performed:

```text
npm run lint
PASS

npm run build
PASS
```

The production build successfully compiled these application routes:

```text
/
 /quality
 /videos
 /videos/[id]
```

The full local integration test also verified:

```text
FastAPI /health                  200
/api/stats/overview              200
/api/stats/scenes                200
/api/stats/actions               200
/api/quality/overview            200
Next.js /                        200
```

---

## 12. Assumptions

1. The Charades CSV files are trusted as the source annotation format.
2. Action intervals are represented in seconds.
3. Existing malformed intervals should be preserved for inspection instead of
   being silently corrected.
4. SQLite is sufficient for this local take-home application.
5. In-memory/frontend filtering is sufficient for the requested scale because
   the backend performs the primary dataset queries.
6. The application focuses on annotation metadata and temporal labels rather
   than serving the original video files.
7. The raw dataset is kept outside Git because of its size and dataset
   distribution considerations.

---

## 13. Limitations

### Video playback

The current application does not serve the original Charades video files.
The tool focuses on annotation and metadata inspection.

### Dataset scope

The current ingestion pipeline uses the Charades training annotations.

The test CSV is retained as an optional raw input but is not currently
ingested into the application database.

### Quality rules

The quality validator intentionally implements a small set of high-value
checks rather than attempting to reproduce every possible annotation-quality
rule.

### Deployment

The project is designed and tested for local execution. Production deployment
is outside the scope of this take-home implementation.

---

## 14. Why SQLite?

SQLite was chosen deliberately because this is a small, self-contained
annotation inspection tool.

It provides:

* zero external database setup;
* deterministic local execution;
* SQL filtering and aggregation;
* easy reproducibility;
* a clean path from parsed annotations to API queries.

A production system with multiple concurrent users or substantially larger
datasets could replace SQLite with a managed relational database or a
search-oriented storage layer.

---

## 15. What I Would Improve With Two More Hours

With two additional hours, I would focus first on improving the annotation
inspection experience rather than adding unrelated infrastructure. I would add
a more detailed annotation timeline with clearer overlap visualization,
annotation-level filtering, and a direct link from each quality issue to the
corresponding annotation on a video detail page. I would also add CSV/JSON
export for filtered video and quality-issue results so the tool could fit more
naturally into a real annotation-review workflow. Finally, I would add a
small set of frontend integration tests and improve the empty/loading/error
states.

---

## 16. One Thing That Was Unknown

One unknown was how strictly to interpret temporal intervals in the Charades
annotation format, particularly when an annotation's end time was outside the
video duration or before its start time. I checked the dataset documentation
and existing Charades parsing implementations to understand how the
`class start end` values are represented and decided to preserve the source
values during parsing rather than silently modify them. I then implemented
validation as a separate step so suspicious intervals remain visible while
being explicitly flagged. This separation makes it possible to inspect the
original data and distinguish parsing from quality policy.

---

## 17. Development Time

Approximate time allocation:

| Area                                           | Approx. time |
| ---------------------------------------------- | -----------: |
| Dataset investigation and format understanding |       30 min |
| Parser and data models                         |       45 min |
| Quality validation                             |       30 min |
| SQLite ingestion and APIs                      |       45 min |
| Frontend implementation                        |       90 min |
| Integration/debugging                          |       45 min |
| Tests and validation                           |       30 min |
| Documentation and cleanup                      |       30 min |

These are approximate engineering-time estimates rather than automated
measurements.

---

## 18. Project Structure

```text
labellens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   ├── models/
│   │   ├── parsers/
│   │   ├── services/
│   │   └── validators/
│   ├── requirements.txt
│   └── tests/
├── data/
│   ├── raw/
│   │   └── charades/
│   └── processed/
├── frontend/
│   ├── app/
│   └── src/
├── scripts/
│   └── ingest_charades.py
├── setup.sh
├── run.sh
└── README.md
```

---

## 19. Git Development History

The implementation was developed through multiple incremental commits:

```text
3be239a  chore: initialize LabelLens backend
2a7bbcf  feat: add Charades parsing and quality validation
ecd6a2b  feat: add SQLite ingestion and dataset APIs
33a481d  feat: add LabelLens web dashboard and quality explorer
```

This separates the implementation into meaningful stages:

```text
foundation
    ↓
dataset parsing + validation
    ↓
database + API
    ↓
web application
```

---

## 20. Future Improvements

Potential next steps include:

* annotation-level search;
* JSON/CSV export;
* richer temporal overlap visualization;
* direct quality-issue → annotation navigation;
* frontend automated tests;
* video playback when video files are available;
* configurable validation rules;
* ingestion of the test split;
* background ingestion for larger datasets;
* production database/search integration;
* deployment behind a production API/frontend setup.

---

## License / Dataset Notice

LabelLens is a take-home engineering project. The Charades dataset and its
annotations are external research data and are not redistributed in this
repository.

Users should obtain and use the dataset according to its original
distribution terms and license.

