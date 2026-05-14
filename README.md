# 🌿 Lettuce Growth Digital Twin

[![Model: XGBoost](https://img.shields.io/badge/Model-XGBoost-green.svg)](https://xgboost.readthedocs.io/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-blue.svg)](https://fastapi.tiangolo.com/)
[![Frontend: Three.js](https://img.shields.io/badge/Frontend-Three.js-orange.svg)](https://threejs.org/)

A high-fidelity Digital Twin for vertical farming that simulates and predicts lettuce growth based on environmental parameters. This project combines machine learning (XGBoost) with real-time 3D visualization (Three.js) to provide a predictive interface for indoor agriculture.

---

## 🚀 Key Features

- **Predictive Modeling:** Utilizes a trained XGBoost model to predict 7 key growth metrics:
  - Shoot Fresh/Dry Weight
  - Root Fresh/Dry Weight
  - Leaf Area
  - Total Biomass
- **Interactive 3D Visualization:** Real-time 3D rendering of the lettuce plant that responds to environmental inputs and growth stages.
- **Dynamic Lighting Simulation:** The 3D scene adjusts its ambient and directional light intensity based on the "Radiation" input.
- **Real-time Metrics:** Dashboard with animated value updates and delta indicators (↑/↓) to compare growth changes.
- **FastAPI Backend:** High-performance, type-safe API for serving model predictions.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.12+**
- **FastAPI:** Modern web framework for the prediction API.
- **XGBoost:** Gradient boosting library for high-accuracy growth prediction.
- **Scikit-learn & Joblib:** For model preprocessing and serialization.
- **Pydantic:** Strict data validation for environmental inputs.

### Frontend
- **Three.js:** 3D engine for plant visualization.
- **Vanilla JavaScript:** Responsive UI logic and API integration.
- **CSS3:** Modern grid and flexbox layout with glassmorphism effects.

---

## 📁 Project Structure

```text
lettuce-digital-twin/
├── backend/
│   ├── main.py                    # FastAPI application & model loading
│   ├── lettuce_xgboost_model.pkl  # Trained ML model weights
│   ├── requirements.txt           # Python dependencies
│   └── test_main.py               # Backend unit tests
├── frontend/
│   ├── index.html                 # Main UI layout
│   ├── style.css                  # Custom styling & animations
│   ├── app.js                     # UI Logic & API communication
│   └── plant-viz.js               # Three.js 3D scene management
└── .gitignore                     # Environment & cache exclusions
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Python 3.12 or higher installed.
- A modern web browser with WebGL support (Chrome, Firefox, Edge).

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8005
```

### 3. Frontend Setup
Simply open `frontend/index.html` in your web browser. 
*Note: Ensure the backend is running on port 8005 for predictions to work.*

---

## 📊 How it Works

1. **Input Stage:** Users adjust environmental sliders for CO2 (ppm), Temperature (°C), Humidity (%), Radiation (W/m²), and Days After Transplant.
2. **Prediction Stage:** The frontend sends a JSON payload to the FastAPI `/predict` endpoint.
3. **Model Processing:** The XGBoost model calculates expected biomass. If the model file is missing, the system falls back to a sophisticated mock growth formula.
4. **Visualization Stage:** 
   - Numerical results are updated with easing animations.
   - The 3D plant in the viewport scales its leaves and roots proportionally to the predicted mass.
   - Scene lighting changes to reflect the selected radiation level.

---

## 🧪 Testing
The project includes a test suite for the backend API.
```bash
cd backend
pytest
```

---

## 🤝 Contributing
Contributions are welcome! If you'd like to improve the model accuracy or enhance the 3D visualization, feel free to fork the repo and submit a PR.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
