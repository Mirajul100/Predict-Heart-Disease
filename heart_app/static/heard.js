const form = document.getElementById('predictForm');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');

const resultSection = document.getElementById('resultSection');
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultLabel = document.getElementById('resultLabel');
const resultTitle = document.getElementById('resultTitle');
const resultDesc = document.getElementById('resultDesc');
const probPct = document.getElementById('probPct');
const probFill = document.getElementById('probFill');

// -------------------- ICONS --------------------
const HIGH_ICON = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`;
const LOW_ICON  = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-4.5h4v4.5l-2 1.5-2-1.5zm1-7.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>`;

// -------------------- CSRF --------------------
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// -------------------- TOAST --------------------
function showToast(msg, color) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastDot').style.background = color;
    t.classList.add('show');

    setTimeout(() => t.classList.remove('show'), 3500);
}

// -------------------- FORM SUBMIT --------------------
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const predictUrl = form.dataset.predictUrl;
    const historyUrl = form.dataset.historyUrl;

    if (!predictUrl) {
        showToast("Predict URL missing", "#ff6b35");
        return;
    }

    btnText.textContent = 'Analyzing...';
    spinner.style.display = 'block';

    try {
        const fd = new FormData(form);

        const res = await fetch(predictUrl, {
            method: 'POST',
            body: fd,
            headers: {
                'X-CSRFToken': csrftoken
            }
        });

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Server did not return JSON");
        }

        if (!res.ok) {
            throw new Error(data.error || "Server error");
        }

        if (data.prediction === undefined || data.probability === undefined) {
            throw new Error("Invalid response from backend");
        }

        const isHigh = data.prediction === 1;
        const pct = Math.round(data.probability * 100);

        // UI update
        resultCard.className = 'result-card ' + (isHigh ? 'high-risk' : 'low-risk');
        resultIcon.innerHTML = isHigh ? HIGH_ICON : LOW_ICON;

        resultLabel.textContent = isHigh ? '⚠ Risk Assessment' : '✓ Risk Assessment';
        resultTitle.textContent = isHigh
            ? 'High Risk of Heart Disease'
            : 'Low Risk of Heart Disease';

        resultDesc.textContent = isHigh
            ? 'High cardiovascular risk detected. Consult a cardiologist immediately.'
            : 'Low risk detected. Maintain healthy lifestyle and regular checkups.';

        probPct.textContent = pct + '% confidence';
        probFill.style.width = '0%';

        resultSection.style.display = 'block';

        setTimeout(() => {
            probFill.style.width = pct + '%';
        }, 100);

        resultSection.scrollIntoView({ behavior: 'smooth' });

        showToast(
            isHigh ? 'High risk detected' : 'Low risk detected',
            isHigh ? '#e8304a' : '#00d68f'
        );

        refreshHistory(historyUrl);

    } catch (err) {
        showToast(err.message, '#ff6b35');
    } finally {
        btnText.textContent = 'Analyze Patient Data';
        spinner.style.display = 'none';
    }
});

// -------------------- HISTORY --------------------
async function refreshHistory(historyUrl) {
    if (!historyUrl) return;

    try {
        const res = await fetch(historyUrl);

        if (!res.ok) return;

        const data = await res.json();

        if (!data.records) return;

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
        console.log("History load failed:", err);
    }
}