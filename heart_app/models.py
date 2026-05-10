from django.db import models

class PredictionRecord(models.Model):
    age = models.IntegerField()
    sex = models.CharField(max_length=1)
    chest_pain_type = models.CharField(max_length=10)
    resting_bp = models.IntegerField()
    cholesterol = models.IntegerField()
    fasting_bs = models.IntegerField()
    resting_ecg = models.CharField(max_length=10)
    max_hr = models.IntegerField()
    exercise_angina = models.CharField(max_length=1)
    oldpeak = models.FloatField()
    st_slope = models.CharField(max_length=10)
    prediction = models.IntegerField()  # 0 or 1
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        result = "High Risk" if self.prediction == 1 else "Low Risk"
        return f"Age {self.age}, {self.sex} - {result} ({self.created_at.strftime('%Y-%m-%d')})"
