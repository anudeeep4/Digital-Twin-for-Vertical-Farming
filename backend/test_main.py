from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert "status" in json_data
    assert json_data["status"] == "Lettuce Model API is running."
    assert "model_loaded" in json_data

def test_predict_valid_data():
    payload = {
        "co2": 400.0,
        "temperature": 25.0,
        "humidity": 60.0,
        "radiation": 300.0,
        "days_after_transplant": 30.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    
    expected_fields = [
        "shoot_fresh_weight", "shoot_dry_weight", "root_fresh_weight",
        "root_dry_weight", "leaf_area", "total_fresh_weight", "total_dry_weight"
    ]
    for field in expected_fields:
        assert field in json_data
        assert isinstance(json_data[field], float)

def test_predict_invalid_data_bounds():
    # co2 out of valid range (300 to 1200)
    payload = {
        "co2": 200.0,
        "temperature": 25.0,
        "humidity": 60.0,
        "radiation": 300.0,
        "days_after_transplant": 30.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Validation Error

def test_predict_missing_data():
    payload = {
        "co2": 400.0,
        "temperature": 25.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Validation Error
