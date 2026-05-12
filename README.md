# 🫀 CardioScan — Heart Disease Prediction (Django)

A modern, full-stack Django web application for AI-powered cardiovascular risk assessment.

---

## 🗂 Project Structure

```
heart_project/
├── heart_project/          # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── heart_app/              # Main application
|   |__staicfiles
|     |__heard.css
|     |__heard.js
│   ├── templates/
│   │   └── heart_app/
│   │       └── index.html  # Full UI
│   ├── models.py           # PredictionRecord DB model
│   ├── views.py            # Prediction logic + API endpoints
│   ├── forms.py            # HeartPredictionForm
│   ├── urls.py
│   └── admin.py
├── ml_models/              # ← Place your .pkl files here
│   ├── logistic_heart.pkl
│   ├── scaler.pkl
│   └── columns_heart.pkl
|___staicfiles
|   |__heard.css
|   |__heard.js
├── manage.py
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Run

### 1. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Add your trained ML models
Create the `ml_models/` folder and place your three pickle files inside:
```bash
mkdir ml_models
cp /path/to/logistic_heart.pkl  ml_models/
cp /path/to/scaler.pkl          ml_models/
cp /path/to/columns_heart.pkl   ml_models/
```

> ⚠️ If models are missing, the app runs in **demo mode** and returns random predictions with a warning banner.

### 4. Apply migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. (Optional) Create admin user
```bash
python manage.py createsuperuser
```

### 6. Run the server
```bash
python manage.py runserver
```

Open **http://127.0.0.1:8000** in your browser.

---

## 🔗 URL Routes

| URL | Description |
|-----|-------------|
| `/` | Main prediction UI |
| `/predict/` | POST endpoint — returns JSON prediction |
| `/history/` | GET endpoint — returns last 50 predictions as JSON |
| `/admin/` | Django admin panel |

---

## 🧠 How It Works

1. User fills in 11 clinical fields and submits the form.
2. JavaScript POSTs the form data to `/predict/` via `fetch()`.
3. Django loads the pre-trained scikit-learn model, applies one-hot encoding and StandardScaler, then calls `model.predict()`.
4. The prediction (0 = Low Risk, 1 = High Risk) and probability are returned as JSON.
5. The result card animates in with a confidence progress bar.
6. Each prediction is saved to SQLite via `PredictionRecord`.

---

## 🎨 Tech Stack

- **Backend:** Django 4.x, SQLite
- **ML:** scikit-learn, pandas, joblib
- **Frontend:** Vanilla JS, CSS variables, Google Fonts (Syne + DM Sans)
- **No extra frontend frameworks required**
