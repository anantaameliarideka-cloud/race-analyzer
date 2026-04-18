// ============================================
// MOTOGP RACE STRATEGY ANALYZER
// Main Application Logic
// ============================================

// Global State
let appState = {
    user: {
        name: '',
        skill: '',
        motor: '',
        totalRaces: 0,
        bestTime: null,
        history: []
    },
    currentCircuit: null,
    raceConfig: {
        laps: 25,
        speed: 190,
        weather: 'dry'
    },
    analysis: null
};

// Speed Recommendations
const speedRanges = {
    beginner: { min: 100, max: 150, avg: 125 },
    intermediate: { min: 150, max: 220, avg: 185 },
    expert: { min: 220, max: 280, avg: 250 }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App Loading...');
    loadUserData();
    setupEventListeners();
    initializePages();
    console.log('✅ App Ready!');
});

// ============================================
// PAGE NAVIGATION
// ============================================

function switchPage(pageName) {
    console.log('🔄 Switching to page:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const pageId = pageName + 'Page';
    const page = document.getElementById(pageId);
    
    if (!page) {
        console.error('❌ Page not found:', pageId);
        return;
    }

    page.classList.add('active');
    
    // Scroll to top
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    // Update navbar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    console.log('✅ Page switched successfully');
}

function initializePages() {
    console.log('📱 Initializing pages...');
    
    // Check if user already logged in
    if (appState.user.name && appState.user.name.trim() !== '') {
        console.log('✅ User found:', appState.user.name);
        switchPage('circuit');
        updateUserDisplay();
    } else {
        console.log('👤 No user, showing home page');
        switchPage('home');
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    console.log('📌 Setting up event listeners...');

    // Navbar links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.dataset.page;
            console.log('📍 Nav clicked:', pageName);
            switchPage(pageName);
        });
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function(e) {
        e.preventDefault();
        resetApp();
    });

    // PAGE 1: HOME - Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage('home');
        });
    }

    // PAGE 3: CIRCUIT - Selection (FIX: Attach ke button PILIH)
    document.querySelectorAll('.circuit-card').forEach(card => {
        const btn = card.querySelector('.btn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const circuit = card.dataset.circuit;
                console.log('🏁 Circuit button clicked:', circuit);
                selectCircuit(circuit);
                // Auto-scroll ke hasil
                setTimeout(() => {
                    const display = document.getElementById('circuitDisplay');
                    if (display && display.style.display !== 'none') {
                        display.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 300);
            });
        }
    });

    // PAGE 4: CONFIG - Lap controls
    const lapsInput = document.getElementById('configLaps');
    const lapsSlider = document.getElementById('lapsSlider');
    const speedSlider = document.getElementById('configSpeed');

    if (lapsInput) {
        lapsInput.addEventListener('change', syncLaps);
        lapsInput.addEventListener('input', syncLaps);
    }

    if (lapsSlider) {
        lapsSlider.addEventListener('input', syncLaps);
    }

    const decrementBtn = document.getElementById('decrementLap');
    if (decrementBtn) {
        decrementBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const current = parseInt(lapsInput.value);
            if (current > 1) {
                lapsInput.value = current - 1;
                lapsSlider.value = current - 1;
                updateLapPreview();
            }
        });
    }

    const incrementBtn = document.getElementById('incrementLap');
    if (incrementBtn) {
        incrementBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const current = parseInt(lapsInput.value);
            if (current < 100) {
                lapsInput.value = current + 1;
                lapsSlider.value = current + 1;
                updateLapPreview();
            }
        });
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', function() {
            updateSpeedDisplay();
        });
    }

    const backToCircuitBtn = document.getElementById('backToCircuitBtn');
    if (backToCircuitBtn) {
        backToCircuitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage('circuit');
        });
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performAnalysis();
        });
    }

    // PAGE 5: RESULTS
    const backToConfigBtn = document.getElementById('backToConfigBtn');
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage('config');
        });
    }

    const toAnalysisBtn = document.getElementById('toAnalysisBtn');
    if (toAnalysisBtn) {
        toAnalysisBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage('analysis');
        });
    }

    // PAGE 6: ANALYSIS - Tabs
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            console.log('📑 Tab clicked:', tabName);
            switchAnalysisTab(tabName);
        });
    });

    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportToPDF();
        });
    }

    // PAGE 7: LEADERBOARD - Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const circuit = this.dataset.circuit;
            console.log('🏆 Filter by:', circuit);
            updateLeaderboard(circuit);
        });
    });

    console.log('✅ All event listeners attached');
}

// ============================================
// PAGE 1: HOME - PROFILE SETUP
// ============================================

function handleProfileSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('riderName').value;
    const skill = document.getElementById('skillLevel').value;
    const motor = document.getElementById('motorType').value;

    if (!name || !skill || !motor) {
        alert('Silakan isi semua field!');
        return;
    }

    appState.user = {
        name,
        skill,
        motor,
        totalRaces: 0,
        bestTime: null,
        history: []
    };

    console.log('👤 Profile created:', appState.user);
    saveUserData();
    updateUserDisplay();
    switchPage('circuit');
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    if (appState.user.name) {
        userDisplay.textContent = `👤 ${appState.user.name} (${appState.user.skill})`;
    }

    // Update profile page
    document.getElementById('displayName').textContent = appState.user.name || '-';
    document.getElementById('displaySkill').textContent = 
        `${appState.user.skill.toUpperCase()} (${appState.user.motor})`;
    document.getElementById('displayMotor').textContent = appState.user.motor || '-';
    document.getElementById('displayRaces').textContent = appState.user.totalRaces || 0;
    document.getElementById('displayBestTime').textContent = 
        appState.user.bestTime ? formatTime(appState.user.bestTime) : '-';
}

// ============================================
// PAGE 3: CIRCUIT SELECTION
// ============================================

function selectCircuit(circuitName) {
    const circuit = circuitsData[circuitName];
    if (!circuit) {
        console.error('Circuit not found:', circuitName);
        return;
    }

    appState.currentCircuit = circuitName;
    console.log('✅ Circuit selected:', circuitName);
    
    // Set default laps
    const defaultLaps = circuit.standardLaps || 25;
    const lapsInput = document.getElementById('configLaps');
    const lapsSlider = document.getElementById('lapsSlider');
    
    if (lapsInput) lapsInput.value = defaultLaps;
    if (lapsSlider) lapsSlider.value = defaultLaps;

    // Display circuit info
    displayCircuitInfo(circuit);
}

function displayCircuitInfo(circuit) {
    const display = document.getElementById('circuitDisplay');
    if (!display) {
        console.error('circuitDisplay element not found');
        return;
    }

    display.style.display = 'block';
    console.log('📍 Displaying circuit info:', circuit.name);

    const nameEl = document.getElementById('selectedCircuitName');
    if (nameEl) nameEl.textContent = circuit.name;

    // Generate track visualization
    generateTrackVisualization(circuit, 'trackSvg');

    // Display details
    const detailsList = document.getElementById('circuitDetailsList');
    if (detailsList) {
        detailsList.innerHTML = `
            <div><strong>🏍️ Panjang Lap:</strong> ${circuit.lapLength} km</div>
            <div><strong>🏁 Tikungan:</strong> ${circuit.turns}</div>
            <div><strong>📊 Kesulitan:</strong> ${circuit.difficulty}</div>
            <div><strong>📍 Longest Straight:</strong> ${(circuit.longestStraight * 1000).toFixed(0)} m</div>
            <div><strong>🛞 Lap Standard:</strong> ${circuit.standardLaps} laps</div>
        `;
    }

    // Update config page dengan circuit yang dipilih
    const currentCircuitName = document.getElementById('currentCircuitName');
    const currentCircuitDistance = document.getElementById('currentCircuitDistance');
    
    if (currentCircuitName) currentCircuitName.textContent = circuit.name;
    if (currentCircuitDistance) currentCircuitDistance.textContent = `${circuit.lapLength} km per lap`;
}

// ============================================
// PAGE 4: RACE CONFIGURATION
// ============================================

function syncLaps() {
    const lapsInput = document.getElementById('configLaps');
    const lapsSlider = document.getElementById('lapsSlider');
    
    if (!lapsInput || !lapsSlider) return;

    const value = document.activeElement === lapsInput ? 
        lapsInput.value : lapsSlider.value;
    
    lapsInput.value = value;
    lapsSlider.value = value;
    
    appState.raceConfig.laps = parseInt(value);
    updateLapPreview();
}

function updateLapPreview() {
    if (!appState.currentCircuit) return;

    const circuit = circuitsData[appState.currentCircuit];
    const laps = parseInt(document.getElementById('configLaps').value) || 1;
    const totalDistance = (circuit.lapLength * laps).toFixed(2);

    const preview = document.getElementById('totalDistancePreview');
    if (preview) {
        preview.textContent = `${totalDistance} km`;
    }
}

function updateSpeedDisplay() {
    const speed = document.getElementById('configSpeed').value;
    const speedDisplay = document.getElementById('speedValueDisplay');
    const badge = document.getElementById('speedLevelBadge');

    if (speedDisplay) {
        speedDisplay.textContent = speed;
    }

    appState.raceConfig.speed = parseInt(speed);

    // Update skill level badge
    let skillLevel, badgeText, badgeClass;
    if (speed >= 220) {
        skillLevel = 'expert';
        badgeText = '🔴 Expert';
        badgeClass = 'expert';
    } else if (speed >= 150) {
        skillLevel = 'intermediate';
        badgeText = '🟡 Intermediate';
        badgeClass = 'intermediate';
    } else {
        skillLevel = 'beginner';
        badgeText = '🟢 Beginner';
        badgeClass = 'beginner';
    }

    if (badge) {
        badge.textContent = badgeText;
        badge.className = `level-badge ${badgeClass}`;
    }
}

// ============================================
// ANALYSIS
// ============================================

function performAnalysis() {
    if (!appState.currentCircuit) {
        alert('Pilih sirkuit terlebih dahulu!');
        return;
    }

    const circuit = circuitsData[appState.currentCircuit];
    const laps = appState.raceConfig.laps;
    const speed = appState.raceConfig.speed;
    const weatherRadio = document.querySelector('input[name="weather"]:checked');
    const weather = weatherRadio ? weatherRadio.value : 'dry';

    console.log('📊 Analyzing race:', { circuit: circuit.name, laps, speed, weather });

    // Calculate analysis
    const totalDistance = circuit.lapLength * laps;
    const totalTime = (totalDistance / speed) * 60; // minutes
    const lapTime = totalTime / laps;

    // Adjust for weather
    let weatherMultiplier = 1;
    if (weather === 'wet') weatherMultiplier = 0.85;
    if (weather === 'rain') weatherMultiplier = 0.7;

    const adjustedSpeed = speed * weatherMultiplier;
    const adjustedTotalTime = (totalDistance / adjustedSpeed) * 60;
    const adjustedLapTime = adjustedTotalTime / laps;

    // Determine skill level
    let skillLevel;
    if (speed >= 220) skillLevel = 'expert';
    else if (speed >= 150) skillLevel = 'intermediate';
    else skillLevel = 'beginner';

    appState.analysis = {
        circuit,
        laps,
        speed,
        weather,
        totalDistance,
        lapTime,
        totalTime,
        adjustedSpeed,
        adjustedLapTime,
        adjustedTotalTime,
        skillLevel,
        dangerZones: circuit.corners.filter(c => c.difficulty === 'high')
    };

    console.log('✅ Analysis complete:', appState.analysis);

    // Display results
    displayResults();

    // Update history
    appState.user.history.push({
        date: new Date().toLocaleDateString(),
        circuit: circuit.name,
        laps,
        speed,
        weather,
        time: adjustedTotalTime
    });

    // Update best time if applicable
    if (!appState.user.bestTime || adjustedTotalTime < appState.user.bestTime) {
        appState.user.bestTime = adjustedTotalTime;
    }
    appState.user.totalRaces++;

    saveUserData();
    updateUserDisplay();
    switchPage('results');
}

function displayResults() {
    if (!appState.analysis) return;

    const a = appState.analysis;
    const c = a.circuit;

    // Quick stats
    const resultLapLength = document.getElementById('resultLapLength');
    if (resultLapLength) resultLapLength.textContent = `${c.lapLength} km`;

    const resultTotalDistance = document.getElementById('resultTotalDistance');
    if (resultTotalDistance) resultTotalDistance.textContent = `${a.totalDistance.toFixed(2)} km`;

    const resultDifficulty = document.getElementById('resultDifficulty');
    if (resultDifficulty) resultDifficulty.textContent = c.difficulty;

    const resultTurns = document.getElementById('resultTurns');
    if (resultTurns) resultTurns.textContent = c.turns;

    // Speed recommendations
    const speedRange = speedRanges[a.skillLevel];
    const recSpeed = document.getElementById('recSpeed');
    if (recSpeed) recSpeed.textContent = `${a.speed} km/h`;

    const recMinSpeed = document.getElementById('recMinSpeed');
    if (recMinSpeed) recMinSpeed.textContent = `${speedRange.min} km/h`;

    const recMaxSpeed = document.getElementById('recMaxSpeed');
    if (recMaxSpeed) recMaxSpeed.textContent = `${speedRange.max} km/h`;

    // Time estimation
    const timePerLap = document.getElementById('timePerLap');
    if (timePerLap) timePerLap.textContent = formatTime(a.adjustedLapTime);

    const timeTotal = document.getElementById('timeTotal');
    if (timeTotal) timeTotal.textContent = formatTime(a.adjustedTotalTime);

    // Track visualization
    generateTrackVisualization(c, 'trackPreviewSvg');

    // Detailed analysis
    displayDetailedAnalysis();
}

function displayDetailedAnalysis() {
    const a = appState.analysis;

       // Weather Impact - BAHASA INDONESIA
    let weatherContent = '';
    if (a.weather === 'dry') {
        weatherContent = `
            <p>☀️ <strong>Kondisi Kering</strong></p>
            <p>Level Grip: 100% | Penyesuaian Kecepatan: Tidak ada</p>
            <p>Strategi: Akselerasi maksimal di lurus, belok halus untuk grip optimal. Manfaatkan traksi penuh untuk overtaking.</p>
            <p>Tips: Jaga ban tetap hangat, hindari pengereman tiba-tiba.</p>
        `;
    } else if (a.weather === 'wet') {
        weatherContent = `
            <p>🌧️ <strong>Kondisi Basah</strong></p>
            <p>Level Grip: 85% | Penyesuaian Kecepatan: -15%</p>
            <p>Strategi: Kurangi kecepatan di tikungan tajam, input halus dan bertahap, jarak aman lebih jauh dari pembalap lain.</p>
            <p>Perhatian: Hati-hati aquaplaning di area genangan air, hindari genangan di line balap optimal.</p>
            <p>Waktu Lap Disesuaikan: ${formatTime(a.adjustedLapTime)}</p>
            <p>Rekomendasi Ban: Gunakan ban intermediate atau rain compound jika tersedia.</p>
        `;
    } else if (a.weather === 'rain') {
        weatherContent = `
            <p>⛈️ <strong>Kondisi Hujan Lebat</strong></p>
            <p>Level Grip: 70% | Penyesuaian Kecepatan: -30%</p>
            <p>Strategi: Berkendara sangat konservatif, hindari input throttle dan brake mendadak, fokus pada keselamatan dan konsistensi.</p>
            <p>Perhatian: Visibilitas terbatas, area membludak air mengubah grip. Kurangi kecepatan corner minimum 20-30% dari normal.</p>
            <p>Waktu Lap Disesuaikan: ${formatTime(a.adjustedLapTime)}</p>
            <p>Rekomendasi Ban: Wajib gunakan ban rain compound atau full wet untuk traksi maksimal.</p>
            <p>Catatan Penting: Pertahankan jarak aman triple, siap untuk emergency maneuver.</p>
        `;
    }
    const weatherTab = document.getElementById('weatherContent');
    if (weatherTab) weatherTab.innerHTML = weatherContent;

        // Danger Zones - BAHASA INDONESIA
    let dangerContent = '';
    if (a.dangerZones.length > 0) {
        dangerContent = a.dangerZones.map(zone => `
            <div class="danger-zone-item">
                <strong>🚨 ${zone.name}</strong><br>
                Tipe: ${zone.type} | Radius Tikungan: ${zone.radius}m<br>
                <strong>⚠️ Tingkat Kesulitan TINGGI</strong><br>
                📍 Panduan: Dekati dengan sangat hati-hati, aplikasi throttle sangat halus.<br>
                💡 Tips: Kurangi kecepatan masuk 10-15% dari lap normal, jaga konsistensi line.<br>
                ⚡ Bahaya: Area ini sering menyebabkan highside, hindari late apex.
            </div>
        `).join('');
    } else {
        dangerContent = `
            <div class="safe-zone">
                <p>✅ <strong>Zona Aman</strong></p>
                <p>Tidak ada zona bahaya ekstrem di sirkuit ini. Semua tikungan dapat ditempuh dengan agresif sesuai level keahlian.</p>
                <p>💡 Tip: Tetap waspada pada semua tikungan dan manfaatkan grip maksimal yang tersedia.</p>
            </div>
        `;
    }
    const dangerTab = document.getElementById('dangerContent');
    if (dangerTab) dangerTab.innerHTML = dangerContent;

        // Tire Strategy - BAHASA INDONESIA
    let tireContent = '';
    if (a.skillLevel === 'beginner') {
        tireContent = `
            <p>🟢 <strong>Strategi Ban Pemula</strong></p>
            <p>1. <strong>Pilihan Ban:</strong> Gunakan ban sport compound standar</p>
            <p>2. <strong>Pemanasan Ban:</strong> Hangatkan ban secara bertahap (lap pertama 2-3)</p>
            <p>3. <strong>Suhu Optimal:</strong> Pantau suhu ban pada 80-90°C untuk performa terbaik</p>
            <p>4. <strong>Menghindari Kerusakan:</strong> Hindari pengereman dan akselerasi berat yang merusak ban</p>
            <p>5. <strong>Maintenance:</strong> Cek tekanan ban setiap 5 lap, jaga konsistensi</p>
            <p>6. <strong>Durabilitas:</strong> Ban pemula bertahan sekitar 20-25 lap dengan berkendara konservatif</p>
            <p><strong>⚠️ Perhatian:</strong> Jangan mendorong terlalu keras di lap awal, ban belum siap.</p>
        `;
    } else if (a.skillLevel === 'intermediate') {
        tireContent = `
            <p>🟡 <strong>Strategi Ban Menengah</strong></p>
            <p>1. <strong>Pilihan Ban:</strong> Gunakan ban semi-slick atau sport compound berkualitas tinggi</p>
            <p>2. <strong>Pemanasan Agresif:</strong> Panaskan ban ke 85-95°C dalam lap pertama</p>
            <p>3. <strong>Push Progresif:</strong> Dorong speed secara bertahap, pantau tingkat penurunan ban</p>
            <p>4. <strong>Window Performa:</strong> Performa puncak terjadi pada lap 3-15</p>
            <p>5. <strong>Degradasi Ban:</strong> Hati-hati blister ban setelah lap 15, mulai kurangi agresivitas</p>
            <p>6. <strong>Pit Stop:</strong> Jika race panjang, rencanakan pit stop sekitar lap 12-15</p>
            <p>7. <strong>Durabilitas:</strong> Ban menengah dapat bertahan 25-35 lap dengan manajemen baik</p>
            <p><strong>💡 Tips:</strong> Manfaatkan lap-lap tengah untuk aggressive racing sebelum ban degradasi.</p>
        `;
    } else {
        tireContent = `
            <p>🔴 <strong>Strategi Ban Ahli (Profesional)</strong></p>
            <p>1. <strong>Pilihan Ban:</strong> Gunakan ban slick racing murni, sesuaikan compound per kondisi cuaca</p>
            <p>   - Dry: Soft compound untuk grip maksimal</p>
            <p>   - Wet: Intermediate compound</p>
            <p>   - Rain: Full wet compound</p>
            <p>2. <strong>Suhu Ban Optimal:</strong> Jaga pada 90-100°C untuk performa puncak</p>
            <p>3. <strong>Strategi Lap 1:</strong> Dorong sejak lap 1 dengan controlled aggression</p>
            <p>4. <strong>Manajemen Degradasi:</strong> Kelola penurunan ban dengan precision driving</p>
            <p>5. <strong>Pit Stop Strategy:</strong> Rencanakan pit stop strategis sekitar lap 12-15 tergantung keausan</p>
            <p>6. <strong>Late Race Pace:</strong> Kelola pace agresif dengan pemborosan ban minimal di akhir race</p>
            <p>7. <strong>Durabilitas:</strong> Ban ahli dapat bertahan 30-40+ lap dengan manajemen sempurna</p>
            <p><strong>⚡ Teknik Advanced:</strong></p>
            <p>   - Monitoring tire temp real-time</p>
            <p>   - Adjust braking point based on tire grip</p>
            <p>   - Predictive pit stop timing</p>
            <p>   - Multi-compound strategy untuk race panjang</p>
        `;
    }
    const tireTab = document.getElementById('tireContent');
    if (tireTab) tireTab.innerHTML = tireContent;

    // Speed Profile Chart
    generateSpeedChart();

    // Data Table
    generateDataTable();

    // Heatmap
    generateHeatmap(a.circuit);
}

// ============================================
// VISUALIZATIONS
// ============================================

function generateTrackVisualization(circuit, svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) {
        console.error('SVG not found:', svgId);
        return;
    }

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 500 400');

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '500');
    bgRect.setAttribute('height', '400');
    bgRect.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
    svg.appendChild(bgRect);

    // Track path
    const trackPath = createSmoothPath(circuit.coordinates);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', trackPath);
    path.setAttribute('stroke', '#00d4ff');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'rgba(0, 212, 255, 0.08)');
    svg.appendChild(path);

    // Corners
    circuit.corners.forEach((corner, idx) => {
        if (idx < circuit.coordinates.length) {
            const [x, y] = circuit.coordinates[idx];

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');

            if (corner.difficulty === 'high') {
                circle.setAttribute('fill', '#ff4444');
            } else if (corner.difficulty === 'medium') {
                circle.setAttribute('fill', '#ffaa00');
            } else {
                circle.setAttribute('fill', '#00cc66');
            }

            svg.appendChild(circle);

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + 8);
            text.setAttribute('y', y - 5);
            text.setAttribute('fill', '#00d4ff');
            text.setAttribute('font-size', '8');
            text.textContent = corner.name;
            svg.appendChild(text);
        }
    });

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', 250);
    title.setAttribute('y', 25);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#00d4ff');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.textContent = circuit.name;
    svg.appendChild(title);

    // Legend
    const legendItems = [
        { color: '#ff4444', label: 'High' },
        { color: '#ffaa00', label: 'Medium' },
        { color: '#00cc66', label: 'Low' }
    ];

    legendItems.forEach((item, idx) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 10);
        rect.setAttribute('y', 350 + idx * 15);
        rect.setAttribute('width', '8');
        rect.setAttribute('height', '8');
        rect.setAttribute('fill', item.color);
        svg.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 22);
        text.setAttribute('y', 357 + idx * 15);
        text.setAttribute('fill', '#aaa');
        text.setAttribute('font-size', '10');
        text.textContent = item.label;
        svg.appendChild(text);
    });

    console.log('✅ Track visualization generated for:', circuit.name);
}

function createSmoothPath(points) {
    if (points.length < 2) return '';

    let path = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? points.length - 1 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? 0 : i + 2];

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }

    path += ' Z';
    return path;
}

function generateSpeedChart() {
    const canvas = document.getElementById('speedChart');
    if (!canvas) return;

    const a = appState.analysis;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple bar chart
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const data = [
        { label: 'Target Speed', value: a.speed, color: '#00d4ff' },
        { label: 'Adjusted Speed', value: a.adjustedSpeed, color: '#ffaa00' },
        { label: 'Lap Time (min)', value: a.adjustedLapTime, color: '#00cc66' }
    ];

    const barWidth = 80;
    const spacing = 100;
    const maxHeight = 200;

    data.forEach((item, idx) => {
        const x = 80 + idx * spacing;
        const y = 250;
        const normalizedValue = (item.value / 300) * maxHeight;
        const h = Math.min(normalizedValue, maxHeight);

        // Bar
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y - h, barWidth, h);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.fillText(item.label, x + barWidth / 2, y + 25);

        // Value
        ctx.fillStyle = item.color;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(item.value.toFixed(1), x + barWidth / 2, y - h - 10);
    });

    // Axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 250);
    ctx.lineTo(350, 250);
    ctx.stroke();
}

function generateDataTable() {
    const tbody = document.querySelector('#raceDataTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const a = appState.analysis;
    const c = a.circuit;

    for (let i = 1; i <= Math.min(a.laps, 10); i++) {
        const distance = c.lapLength * i;
        const time = a.adjustedLapTime * i;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Lap ${i}</td>
            <td>${distance.toFixed(2)} km</td>
            <td>${a.adjustedSpeed.toFixed(1)} km/h</td>
            <td>${formatTime(time)}</td>
        `;
        tbody.appendChild(row);
    }

    if (a.laps > 10) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; color: #888;">... (${a.laps - 10} laps lebih)</td>
        `;
        tbody.appendChild(row);
    }
}

function generateHeatmap(circuit) {
    const svg = document.getElementById('heatmapSvg');
    if (!svg) return;

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 500 400');

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '500');
    bgRect.setAttribute('height', '400');
    bgRect.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
    svg.appendChild(bgRect);

    // Track
    const trackPath = createSmoothPath(circuit.coordinates);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', trackPath);
    path.setAttribute('stroke', 'rgba(0, 212, 255, 0.3)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'rgba(0, 0, 0, 0.2)');
    svg.appendChild(path);

    // Heat spots
    circuit.corners.forEach((corner, idx) => {
        if (idx < circuit.coordinates.length) {
            const [x, y] = circuit.coordinates[idx];

            let color, opacity;
            if (corner.difficulty === 'high') {
                color = '#ff4444';
                opacity = 0.7;
            } else if (corner.difficulty === 'medium') {
                color = '#ffaa00';
                opacity = 0.4;
            } else {
                color = '#00cc66';
                opacity = 0.2;
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '15');
            circle.setAttribute('fill', color);
            circle.setAttribute('opacity', opacity);
            svg.appendChild(circle);
        }
    });

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', 250);
    title.setAttribute('y', 25);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#00d4ff');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Difficulty Heatmap';
    svg.appendChild(title);
}

// ============================================
// ANALYSIS TABS
// ============================================

function switchAnalysisTab(tabName) {
    console.log('📑 Switching analysis tab:', tabName);

    // Remove active dari semua tabs
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.analysis-section').forEach(section => {
        section.classList.remove('active');
    });

    // Add active ke tab yang dipilih
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    const activeSection = document.getElementById(tabName + 'Tab');
    if (activeSection) activeSection.classList.add('active');
}

// ============================================
// LEADERBOARD
// ============================================

function updateLeaderboard(circuit) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Dummy leaderboard data
    const leaderboardData = [
        { rank: 1, name: 'Marc Márquez', skill: 'Expert', motor: 'MotoGP', circuit: 'Mandalika', time: 82 },
        { rank: 2, name: 'Francesco Bagnaia', skill: 'Expert', motor: 'MotoGP', circuit: 'Mandalika', time: 83 },
        { rank: 3, name: 'Pecco Bagnaia', skill: 'Expert', motor: 'MotoGP', circuit: 'Silverstone', time: 135 },
        ...appState.user.history.map((h, idx) => ({
            rank: idx + 4,
            name: appState.user.name,
            skill: appState.user.skill,
            motor: appState.user.motor,
            circuit: h.circuit,
            time: h.time
        }))
    ];

    // Filter by circuit
    const filtered = circuit === 'all' ? 
        leaderboardData : 
        leaderboardData.filter(item => item.circuit.toLowerCase().includes(circuit.toLowerCase()));

    // Display
    filtered.slice(0, 20).forEach((item, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${item.rank}</td>
            <td>${item.name}</td>
            <td>${item.skill}</td>
            <td>${item.motor}</td>
            <td>${item.circuit}</td>
            <td>${formatTime(item.time)}</td>
            <td>${item.rank < 4 ? '🏆 Pro' : '👤 Amateur'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);

    if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
}

function exportToPDF() {
    if (!appState.analysis) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    const a = appState.analysis;
    const c = a.circuit;

    let pdfContent = `
===========================================
MotoGP RACE STRATEGY ANALYSIS REPORT
===========================================

PEMBALAP: ${appState.user.name}
SKILL LEVEL: ${appState.user.skill}
MOTOR: ${appState.user.motor}
TANGGAL: ${new Date().toLocaleDateString()}

-------------------------------------------
CIRCUIT INFORMATION
-------------------------------------------
Circuit: ${c.name}
Panjang: ${c.lapLength} km
Tikungan: ${c.turns}
Kesulitan: ${c.difficulty}

-------------------------------------------
RACE CONFIGURATION
-------------------------------------------
Jumlah Lap: ${a.laps}
Kecepatan Target: ${a.speed} km/h
Kondisi Cuaca: ${a.weather.toUpperCase()}

-------------------------------------------
HASIL ANALISIS
-------------------------------------------
Total Distance: ${a.totalDistance.toFixed(2)} km
Lap Time: ${formatTime(a.adjustedLapTime)}
Total Time: ${formatTime(a.adjustedTotalTime)}
Adjusted Speed: ${a.adjustedSpeed.toFixed(1)} km/h

-------------------------------------------
HIGH DIFFICULTY ZONES
-------------------------------------------
${a.dangerZones.map(z => `${z.name} (${z.type})`).join('\n')}

===========================================
    `;

    // Download as text file
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
    element.setAttribute('download', `race-analysis-${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert('✅ Report exported successfully!');
}

function resetApp() {
    if (confirm('Apakah Anda yakin ingin reset profile?')) {
        localStorage.removeItem('motogpUserData');
        appState.user = {
            name: '',
            skill: '',
            motor: '',
            totalRaces: 0,
            bestTime: null,
            history: []
        };
        appState.currentCircuit = null;
        appState.analysis = null;
        switchPage('home');
        const profileForm = document.getElementById('profileForm');
        if (profileForm) profileForm.reset();
        console.log('🔄 App reset');
    }
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveUserData() {
    localStorage.setItem('motogpUserData', JSON.stringify(appState.user));
    console.log('💾 User data saved');
}

function loadUserData() {
    const saved = localStorage.getItem('motogpUserData');
    if (saved) {
        appState.user = JSON.parse(saved);
        console.log('📂 User data loaded:', appState.user.name);
    }
}