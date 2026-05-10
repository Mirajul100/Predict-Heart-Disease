const form          = document.getElementById('predictForm');
const btnText       = document.getElementById('btnText');
const spinner       = document.getElementById('spinner');
const resultSection = document.getElementById('resultSection');
const resultCard    = document.getElementById('resultCard');
const resultIcon    = document.getElementById('resultIcon');
const resultLabel   = document.getElementById('resultLabel');
const resultTitle   = document.getElementById('resultTitle');
const resultDesc    = document.getElementById('resultDesc');
const probPct       = document.getElementById('probPct');
const probFill      = document.getElementById('probFill');

// ─── Icons ───────────────────────────────────────────────────────────────────
const HIGH_ICON = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`;
const LOW_ICON  = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-4.5h4v4.5l-2 1.5-2-1.5zm1-7.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>`;

// ─── Read CSRF token from cookie ──────────────────────────────────────────────
function getCookie(name) {
    const match = document.cookie.match(
        new RegExp('(?:^|;)\\s*' + name + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, color = '#ff6b35') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastDot').style.background = color;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Form Submit ──────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const predictUrl = form.dataset.predictUrl;
    const historyUrl = form.dataset.historyUrl;

    if (!predictUrl) {
        showToast('Configuration error: predict URL missing');
        return;
    }

    // Loading state
    btnText.textContent   = 'Analyzing...';
    spinner.style.display = 'block';

    try {
        const fd = new FormData(form);

        const res = await fetch(predictUrl, {
            method:  'POST',
            body:    fd,
            headers: {
                // Send CSRF token as header — required by Django
                'X-CSRFToken': getCookie('csrftoken') || '',
            },
        });

        // Parse as text first, then JSON — catches HTML error pages gracefully
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error('Non-JSON response:', text.slice(0, 300));
            throw new Error(
                res.status === 403
                    ? 'CSRF error — please refresh the page and try again.'
                    : `Server error (${res.status}). Check Vercel function logs.`
            );
        }

        if (!res.ok) {
            throw new Error(data.error || `Server error (${res.status})`);
        }

        if (data.prediction === undefined || data.probability === undefined) {
            throw new Error('Invalid response structure from server');
        }

        // ─── Render result ────────────────────────────────────────────────
        const isHigh = data.prediction === 1;
        const pct    = Math.round(data.probability * 100);

        resultCard.className    = 'result-card ' + (isHigh ? 'high-risk' : 'low-risk');
        resultIcon.innerHTML    = isHigh ? HIGH_ICON : LOW_ICON;
        resultLabel.textContent = isHigh ? '⚠ Risk Assessment' : '✓ Risk Assessment';
        resultTitle.textContent = isHigh
            ? 'High Risk of Heart Disease'
            : 'Low Risk of Heart Disease';
        resultDesc.textContent  = isHigh
            ? 'High cardiovascular risk detected. Consult a cardiologist immediately.'
            : 'Low risk detected. Maintain a healthy lifestyle and schedule regular checkups.';

        probPct.textContent  = pct + '% confidence';
        probFill.style.width = '0%';

        resultSection.style.display = 'block';
        setTimeout(() => { probFill.style.width = pct + '%'; }, 100);
        resultSection.scrollIntoView({ behavior: 'smooth' });

        showToast(
            isHigh ? 'High risk detected' : 'Low risk detected',
            isHigh ? '#e8304a' : '#00d68f'
        );

        if (data.demo) {
            showToast('Demo mode active — ML models not loaded on server', '#ff6b35');
        }

        refreshHistory(historyUrl);

    } catch (err) {
        showToast(err.message);
        console.error('[CardioScan]', err);
    } finally {
        btnText.textContent   = 'Analyze Patient Data';
        spinner.style.display = 'none';
    }
});

// ─── History Refresh ──────────────────────────────────────────────────────────
async function refreshHistory(historyUrl) {
    if (!historyUrl) return;

    try {
        const res = await fetch(historyUrl);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.records || data.records.length === 0) return;

        const list = document.getElementById('historyList');
        if (!list) return;

        list.innerHTML = data.records.slice(0, 5).map(r => `
            <div class="history-item">
                <div class="history-item-left">
                    <div class="h-dot ${r.prediction === 1 ? 'high' : 'low'}"></div>
                    <div>
                        <div class="h-info">Age ${r.age}, ${r.sex}</div>
                        <div class="h-date">${r.created_at}</div>
                    </div>
                </div>
                <span class="h-badge ${r.prediction === 1 ? 'high' : 'low'}">
                    ${r.prediction === 1 ? 'High' : 'Low'}
                </span>
            </div>
        `).join('');

    } catch (err) {
        console.warn('[CardioScan] History load failed:', err);
    }
}