import os, tempfile
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")
from fastapi.testclient import TestClient
from app.main import app, estimate
from datetime import date


def test_flow():
    with TestClient(app) as c:
        rows = c.get("/api/listings", params={"deal": "rent", "city": "tehran"}).json()
        assert rows and all(r["deal"] == "rent" and r["city"] == "tehran" for r in rows)
        assert c.get("/api/listings", params={"q": "Komatsu"}).json()[0]["title_en"].startswith("Komatsu")
        new = c.post("/api/listings", json={"deal": "request", "category": "lab", "title": "Need a spectrometer",
                                            "price": 1000, "unit": "day", "city": "shiraz", "company": "Acme"})
        assert new.status_code == 201
        lid = new.json()["id"]
        ok = c.post(f"/api/listings/{lid}/inquiries", json={"company": "Beta", "phone": "09121234567",
                                                             "start": "2026-10-01", "end": "2026-10-03"})
        assert ok.json()["estimate"] == 3000
        assert c.post(f"/api/listings/{lid}/inquiries", json={"company": "Beta", "phone": "123"}).status_code == 422
        assert c.post(f"/api/listings/{lid}/inquiries", json={"company": "Beta", "phone": "09121234567",
                      "start": "2026-10-03", "end": "2026-10-01"}).status_code == 422
        assert c.get("/api/listings/99999").status_code == 404
        assert c.get("/api/stats").json()["inquiries"] == 1
    assert estimate(100, "month", date(2026, 1, 1), date(2026, 2, 5)) == 200
    assert estimate(100, "project", date(2026, 1, 1), date(2026, 2, 5)) == 100
