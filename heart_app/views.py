import os
import json
import pandas as pd
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .forms import HeartPredictionForm
from .models import PredictionRecord

# ─── Model loader (cached after first call) ───────────────────────────────────
_model   = None
_scaler  = None
_columns = None

def _load_models():
    global _model, _scaler, _columns
    if _model is not None:
        return True
    try:
        import joblib
        ml_dir   = settings.ML_MODELS_DIR
        _model   = joblib.load(ml_dir / 'logistic_heart.pkl')
        _scaler  = joblib.load(ml_dir / 'scaler.pkl')
        _columns = joblib.load(ml_dir / 'columns_heart.pkl')
        return True
    except Exception as e:
        print(f"[ML] Could not load models: {e}")
        return False

NUMERICAL_COLUMNS = ['Age', 'RestingBP', 'Cholesterol', 'MaxHR', 'Oldpeak']

def _predict(form_data: dict) -> dict:
    """Run ML prediction. Falls back to demo mode if models are missing."""
    if not _load_models():
        import random
        pred = random.randint(0, 1)
        return {
            'prediction':  pred,
            'probability': round(random.uniform(0.55, 0.92), 2),
            'demo': True,
        }

    raw = {
        'Age':            int(form_data['age']),
        'RestingBP':      int(form_data['resting_bp']),
        'Cholesterol':    int(form_data['cholesterol']),
        'FastingBS':      int(form_data['fasting_bs']),
        'MaxHR':          int(form_data['max_hr']),
        'Oldpeak':        float(form_data['oldpeak']),
        'Sex':            form_data['sex'],
        'ChestPainType':  form_data['chest_pain_type'],
        'RestingECG':     form_data['resting_ecg'],
        'ExerciseAngina': form_data['exercise_angina'],
        'ST_Slope':       form_data['st_slope'],
    }

    df = pd.DataFrame([raw])
    df = pd.get_dummies(df)
    for col in _columns:
        if col not in df.columns:
            df[col] = 0
    df = df[_columns]
    df[NUMERICAL_COLUMNS] = _scaler.transform(df[NUMERICAL_COLUMNS])

    pred  = int(_model.predict(df)[0])
    proba = float(_model.predict_proba(df)[0][pred])
    return {'prediction': pred, 'probability': round(proba, 2), 'demo': False}

# ─── Views ────────────────────────────────────────────────────────────────────

def index(request):
    form   = HeartPredictionForm()
    recent = PredictionRecord.objects.order_by('-created_at')[:5]
    stats  = {
        'total':     PredictionRecord.objects.count(),
        'high_risk': PredictionRecord.objects.filter(prediction=1).count(),
        'low_risk':  PredictionRecord.objects.filter(prediction=0).count(),
    }
    return render(request, 'heart_app/index.html', {
        'form':   form,
        'recent': recent,
        'stats':  stats,
    })


@require_http_methods(["POST"])
def predict(request):
    """Always returns JSON — never an HTML error page."""
    try:
        form = HeartPredictionForm(request.POST)

        if not form.is_valid():
            return JsonResponse(
                {'error': 'Invalid form data', 'details': form.errors},
                status=400
            )

        cd     = form.cleaned_data
        result = _predict({
            'age':             cd['age'],
            'sex':             cd['sex'],
            'chest_pain_type': cd['chest_pain_type'],
            'resting_bp':      cd['resting_bp'],
            'cholesterol':     cd['cholesterol'],
            'fasting_bs':      cd['fasting_bs'],
            'resting_ecg':     cd['resting_ecg'],
            'max_hr':          cd['max_hr'],
            'exercise_angina': cd['exercise_angina'],
            'oldpeak':         cd['oldpeak'],
            'st_slope':        cd['st_slope'],
        })

        # Save to DB (wrapped so a DB failure doesn't break the response)
        try:
            PredictionRecord.objects.create(
                age=cd['age'],             sex=cd['sex'],
                chest_pain_type=cd['chest_pain_type'],
                resting_bp=cd['resting_bp'],
                cholesterol=cd['cholesterol'],
                fasting_bs=cd['fasting_bs'],
                resting_ecg=cd['resting_ecg'],
                max_hr=cd['max_hr'],
                exercise_angina=cd['exercise_angina'],
                oldpeak=cd['oldpeak'],     st_slope=cd['st_slope'],
                prediction=result['prediction'],
            )
        except Exception as db_err:
            print(f"[DB] Save failed: {db_err}")
            # Still return the prediction result even if DB save fails

        return JsonResponse(result)

    except Exception as e:
        print(f"[predict] Unexpected error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


def history(request):
    """Returns last 5 predictions as JSON."""
    try:
        records = PredictionRecord.objects.order_by('-created_at')[:5]
        data = [
            {
                'id':         r.id,
                'age':        r.age,
                'sex':        r.sex,
                'prediction': r.prediction,
                'created_at': r.created_at.strftime('%b %d, %H:%M'),
            }
            for r in records
        ]
        return JsonResponse({'records': data})
    except Exception as e:
        print(f"[history] Error: {e}")
        return JsonResponse({'records': [], 'error': str(e)}, status=500)