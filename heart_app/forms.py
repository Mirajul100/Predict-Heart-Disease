from django import forms

SEX_CHOICES = [('M', 'Male'), ('F', 'Female')]
CHEST_PAIN_CHOICES = [
    ('ATA', 'Atypical Angina (ATA)'),
    ('NAP', 'Non-Anginal Pain (NAP)'),
    ('TA', 'Typical Angina (TA)'),
    ('ASY', 'Asymptomatic (ASY)'),
]
FASTING_BS_CHOICES = [(0, 'No (< 120 mg/dl)'), (1, 'Yes (> 120 mg/dl)')]
RESTING_ECG_CHOICES = [
    ('Normal', 'Normal'),
    ('ST', 'ST-T Wave Abnormality'),
    ('LVH', 'Left Ventricular Hypertrophy'),
]
EXERCISE_ANGINA_CHOICES = [('Y', 'Yes'), ('N', 'No')]
ST_SLOPE_CHOICES = [('Up', 'Upsloping'), ('Flat', 'Flat'), ('Down', 'Downsloping')]


class HeartPredictionForm(forms.Form):
    age = forms.IntegerField(
        min_value=18, max_value=100, initial=40,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '18–100'})
    )
    sex = forms.ChoiceField(
        choices=SEX_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    chest_pain_type = forms.ChoiceField(
        choices=CHEST_PAIN_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    resting_bp = forms.IntegerField(
        min_value=80, max_value=200, initial=120,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '80–200 mmHg'})
    )
    cholesterol = forms.IntegerField(
        min_value=100, max_value=600, initial=200,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '100–600 mg/dl'})
    )
    fasting_bs = forms.ChoiceField(
        choices=FASTING_BS_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    resting_ecg = forms.ChoiceField(
        choices=RESTING_ECG_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    max_hr = forms.IntegerField(
        min_value=60, max_value=220, initial=150,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '60–220 bpm'})
    )
    exercise_angina = forms.ChoiceField(
        choices=EXERCISE_ANGINA_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    oldpeak = forms.FloatField(
        min_value=0.0, max_value=6.0, initial=1.0,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '0.0–6.0', 'step': '0.1'})
    )
    st_slope = forms.ChoiceField(
        choices=ST_SLOPE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
