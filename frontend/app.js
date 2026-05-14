// Default values
const DEFAULTS = {
    co2: 422.6,
    temperature: 26.41,
    humidity: 66.58,
    radiation: 234.67,
    dat: 32
};

// State
let lastPrediction = null;

// DOM Elements
const inputs = ['co2', 'temperature', 'humidity', 'radiation', 'dat'];
const predictBtn = document.getElementById('predict-btn');
const resetBtn = document.getElementById('reset-btn');
const loader = document.getElementById('loader');
const toastContainer = document.getElementById('toast-container');

// Sync Sliders and Number inputs
inputs.forEach(id => {
    const slider = document.getElementById(id);
    const numInput = document.getElementById(`${id}-num`);
    
    slider.addEventListener('input', (e) => {
        numInput.value = e.target.value;
        // Dispatch custom event to let Three.js know interactive lighting might need to change
        if(id === 'radiation') window.dispatchEvent(new CustomEvent('radiationChanged', {detail: e.target.value}));
    });
    
    numInput.addEventListener('input', (e) => {
        // Enforce bounds manually
        let val = parseFloat(e.target.value);
        let min = parseFloat(e.target.min);
        let max = parseFloat(e.target.max);
        
        if (val < min) val = min;
        if (val > max) val = max;
        
        slider.value = val;
        numInput.value = val;
        if(id === 'radiation') window.dispatchEvent(new CustomEvent('radiationChanged', {detail: val}));
    });
});

// Toast util
function showToast(msg) {
    toastContainer.textContent = msg;
    toastContainer.style.display = 'block';
    setTimeout(() => { toastContainer.style.display = 'none'; }, 5000);
}

// Reset
resetBtn.addEventListener('click', () => {
    inputs.forEach(id => {
        const slider = document.getElementById(id);
        const numInput = document.getElementById(`${id}-num`);
        slider.value = DEFAULTS[id];
        numInput.value = DEFAULTS[id];
        if(id === 'radiation') window.dispatchEvent(new CustomEvent('radiationChanged', {detail: DEFAULTS[id]}));
    });
});

// Predict
predictBtn.addEventListener('click', async () => {
    // Gather values
    const payload = {
        co2: parseFloat(document.getElementById('co2').value),
        temperature: parseFloat(document.getElementById('temperature').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        radiation: parseFloat(document.getElementById('radiation').value),
        days_after_transplant: parseFloat(document.getElementById('dat').value)
    };

    // Loading State
    predictBtn.disabled = true;
    loader.style.display = 'inline-block';
    window.dispatchEvent(new Event('predictionLoading'));

    try {
        const response = await fetch('http://127.0.0.1:8005/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Prediction failed');
        }

        const data = await response.json();
        updateMetrics(data);
        
        // Notify Plant Viz
        window.dispatchEvent(new CustomEvent('predictionSuccess', { detail: data }));
        
        lastPrediction = data;
    } catch (err) {
        showToast(err.message || "Failed to connect to the backend server.");
    } finally {
        predictBtn.disabled = false;
        loader.style.display = 'none';
    }
});

// Update Metrics with Animation
function updateMetrics(newData) {
    const keys = [
        'shoot_fresh_weight', 'shoot_dry_weight', 
        'root_fresh_weight', 'root_dry_weight', 
        'leaf_area', 'total_fresh_weight', 'total_dry_weight'
    ];

    keys.forEach(key => {
        const outEl = document.getElementById(`out-${key}`);
        const deltaEl = document.getElementById(`d-${key}`);
        
        const oldVal = lastPrediction ? lastPrediction[key] : 0;
        const newVal = newData[key];
        
        animateValue(outEl, oldVal, newVal, 1500);

        if (lastPrediction) {
            const diff = newVal - oldVal;
            if (Math.abs(diff) > 0.01) {
                const isUp = diff > 0;
                deltaEl.textContent = isUp ? '↑' : '↓';
                deltaEl.className = `delta ${isUp ? 'up' : 'down'}`;
            } else {
                deltaEl.textContent = '';
                deltaEl.className = 'delta';
            }
        } else {
             deltaEl.textContent = '';
             deltaEl.className = 'delta';
        }
    });
}

// Number count up animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + easeOut * (end - start);
        
        obj.innerHTML = current.toFixed(2);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toFixed(2);
        }
    };
    window.requestAnimationFrame(step);
}
