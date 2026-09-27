from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "labellens-api"


def test_list_videos():
    response = client.get("/api/videos?limit=5")

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) == 5
    assert data["total"] == 7985
    assert data["limit"] == 5
    assert data["offset"] == 0


def test_video_detail():
    response = client.get("/api/videos/MJO7C")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == "MJO7C"
    assert data["scene"] == "Kitchen"
    assert data["length"] == 31.38
    assert len(data["annotations"]) == 2
    assert "phone" in data["objects"]


def test_missing_video():
    response = client.get("/api/videos/DOES_NOT_EXIST")

    assert response.status_code == 404


def test_scene_filter():
    response = client.get(
        "/api/videos?scene=Kitchen&limit=5"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) <= 5

    for item in data["items"]:
        assert item["scene"] == "Kitchen"


def test_search():
    response = client.get(
        "/api/videos?search=MJO7C"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["id"] == "MJO7C"


def test_stats_overview():
    response = client.get("/api/stats/overview")

    assert response.status_code == 200

    data = response.json()

    assert data["videos"] == 7985
    assert data["annotations"] == 49809
    assert data["action_classes"] == 157
    assert data["object_classes"] == 38


def test_quality_overview():
    response = client.get("/api/quality/overview")

    assert response.status_code == 200

    data = response.json()

    assert data["total_issues"] == 14598
    assert data["errors"] == 7
    assert data["warnings"] == 14591
    assert data["affected_videos"] == 5896


def test_quality_errors():
    response = client.get(
        "/api/quality/issues?severity=error&limit=10"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 7
    assert len(data["items"]) == 7

    for issue in data["items"]:
        assert issue["severity"] == "error"
        assert issue["issue_type"] == "invalid_interval"