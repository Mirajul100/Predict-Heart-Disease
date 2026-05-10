from django.contrib import admin
from .models import PredictionRecord

@admin.register(PredictionRecord)
class PredictionRecordAdmin(admin.ModelAdmin):
    list_display  = ('age', 'sex', 'chest_pain_type', 'prediction', 'created_at')
    list_filter   = ('prediction', 'sex', 'chest_pain_type')
    search_fields = ('age',)
    readonly_fields = ('created_at',)
