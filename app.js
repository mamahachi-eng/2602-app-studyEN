// ===== Constants & Limits =====
const LIMITS = {
    MAX_LINE_LENGTH: 300,
    MAX_LINES: 1000,
    MAX_PACK_SIZE: 200 * 1024, // 200KB
    MAX_STORAGE_SIZE: 5 * 1024 * 1024 // 5MB
};

const STORAGE_KEYS = {
    SETTINGS: 'app_settings',
    PROGRESS: 'app_progress'
};

// ===== State =====
const state = {
    currentScreen: 'home',
    packs: [],
    currentPack: null,
    currentScript: [],
    currentLineIndex: 0,
    isPlaying: false,
    isPaused: false,
    settings: {
        rate: 1.0,
        gap: 800,
        voiceURI: '',
        lastPackId: ''
    },
    progress: {},
    reviewOnlyMode: false,
    voices: [],
    speechQueue: []
};

// ===== Utility Functions =====

/**
 * Validate file path to prevent path traversal
 */
function validateScriptPath(path) {
    if (!path || typeof path !== 'string') {
        throw new Error('Invalid path format');
    }
    if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
        throw new Error('Path traversal detected');
    }
    if (!path.startsWith('packs/')) {
        throw new Error('Path must start with packs/');
    }
    return path;
}

/**
 * Safely fetch and parse JSON with size limits
 */
async function safeFetchJSON(url, maxSize = LIMITS.MAX_PACK_SIZE) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
            throw new Error('Invalid content type');
        }
        
        const text = await response.text();
        
        // Check size
        if (text.length > maxSize) {
            throw new Error(`File too large (max ${maxSize} bytes)`);
        }
        
        const data = JSON.parse(text);
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}

/**
 * Validate pack index structure
 */
function validatePackIndex(data) {
    if (!Array.isArray(data)) {
        throw new Error('Pack index must be an array');
    }
    
    data.forEach((pack, idx) => {
        if (!pack.id || typeof pack.id !== 'string') {
            throw new Error(`Pack ${idx}: missing or invalid id`);
        }
        if (!pack.title || typeof pack.title !== 'string') {
            throw new Error(`Pack ${idx}: missing or invalid title`);
        }
        if (!pack.scriptFile || typeof pack.scriptFile !== 'string') {
            throw new Error(`Pack ${idx}: missing or invalid scriptFile`);
        }
    });
    
    return data;
}

/**
 * Validate script structure
 */
function validateScript(data) {
    if (!Array.isArray(data)) {
        throw new Error('Script must be an array');
    }
    
    if (data.length > LIMITS.MAX_LINES) {
        throw new Error(`Too many lines (max ${LIMITS.MAX_LINES})`);
    }
    
    data.forEach((line, idx) => {
        if (!line.role || typeof line.role !== 'string') {
            throw new Error(`Line ${idx}: missing or invalid role`);
        }
        if (!line.text || typeof line.text !== 'string') {
            throw new Error(`Line ${idx}: missing or invalid text`);
        }
        if (line.text.length > LIMITS.MAX_LINE_LENGTH) {
            throw new Error(`Line ${idx}: text too long (max ${LIMITS.MAX_LINE_LENGTH} chars)`);
        }
    });
    
    return data;
}

/**
 * Show error message safely (no innerHTML)
 */
function showError(elementId, message) {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.textContent = `Error: ${message}`;
        elem.style.display = 'block';
    }
}

/**
 * Hide error message
 */
function hideError(elementId) {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.style.display = 'none';
        elem.textContent = '';
    }
}

/**
 * Show status message safely
 */
function showStatus(elementId, message, type = 'success') {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.textContent = message;
        elem.className = `status-text ${type}`;
        elem.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            elem.style.display = 'none';
        }, 3000);
    }
}

// ===== Storage Functions =====

function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            const parsed = JSON.parse(stored);
            state.settings = { ...state.settings, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function saveSettings() {
    try {
        const serialized = JSON.stringify(state.settings);
        if (serialized.length > LIMITS.MAX_STORAGE_SIZE) {
            throw new Error('Settings data too large');
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized);
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function loadProgress() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        if (stored) {
            state.progress = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
        state.progress = {};
    }
}

function saveProgress() {
    try {
        const serialized = JSON.stringify(state.progress);
        if (serialized.length > LIMITS.MAX_STORAGE_SIZE) {
            throw new Error('Progress data too large');
        }
        localStorage.setItem(STORAGE_KEYS.PROGRESS, serialized);
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

function getPackProgress(packId) {
    if (!state.progress[packId]) {
        state.progress[packId] = {
            lineStats: {},
            reviewQueue: [],
            lastIndex: 0,
            updatedAt: new Date().toISOString()
        };
    }
    return state.progress[packId];
}

function updateLineStats(packId, lineIndex, score) {
    const progress = getPackProgress(packId);
    
    if (!progress.lineStats[lineIndex]) {
        progress.lineStats[lineIndex] = {
            bestScore: 0,
            attempts: 0,
            lastScore: 0
        };
    }
    
    const stats = progress.lineStats[lineIndex];
    stats.attempts += 1;
    stats.lastScore = score;
    stats.bestScore = Math.max(stats.bestScore, score);
    
    // Add to review queue if score < 90 and not already in queue
    if (score < 90 && !progress.reviewQueue.includes(lineIndex)) {
        progress.reviewQueue.push(lineIndex);
    }
    
    progress.updatedAt = new Date().toISOString();
    saveProgress();
}

function calculatePackCompletion(packId, totalLines) {
    const progress = getPackProgress(packId);
    const completedLines = Object.values(progress.lineStats)
        .filter(stat => stat.bestScore >= 90).length;
    return totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;
}

function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        state.progress = {};
        state.settings = {
            rate: 1.0,
            gap: 800,
            voiceURI: '',
            lastPackId: ''
        };
        showStatus('settings-status', 'All data has been reset', 'success');
        updateSettingsDisplay();
    }
}

// ===== Screen Navigation =====

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.add('active');
        state.currentScreen = screenName;
    }
}

// ===== Home Screen =====

async function loadPackList() {
    try {
        hideError('error-home');
        const data = await safeFetchJSON('packs/index.json', 50 * 1024);
        state.packs = validatePackIndex(data);
        renderPackList();
    } catch (error) {
        showError('error-home', error.message);
    }
}

function renderPackList() {
    const container = document.getElementById('pack-list');
    container.textContent = ''; // Clear safely
    
    if (state.packs.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No packs available. Add packs to the packs/ directory.';
        message.style.color = 'var(--text-muted)';
        container.appendChild(message);
        return;
    }
    
    state.packs.forEach(pack => {
        const card = createPackCard(pack);
        container.appendChild(card);
    });
}

function createPackCard(pack) {
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.addEventListener('click', () => loadPack(pack));
    
    // Title
    const title = document.createElement('h3');
    title.textContent = pack.title;
    card.appendChild(title);
    
    // Meta info
    const meta = document.createElement('div');
    meta.className = 'pack-meta';
    
    if (pack.category) {
        const category = document.createElement('span');
        category.textContent = `📁 ${pack.category}`;
        meta.appendChild(category);
    }
    
    if (pack.level) {
        const level = document.createElement('span');
        level.textContent = `📊 ${pack.level}`;
        meta.appendChild(level);
    }
    
    card.appendChild(meta);
    
    // Progress
    const progressContainer = document.createElement('div');
    progressContainer.className = 'pack-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    
    // Calculate progress (we don't know line count yet, so use 0 for now)
    const completion = state.progress[pack.id] 
        ? calculatePackCompletion(pack.id, Object.keys(state.progress[pack.id].lineStats).length)
        : 0;
    progressFill.style.width = `${completion}%`;
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = `${completion}% complete`;
    progressContainer.appendChild(progressText);
    
    card.appendChild(progressContainer);
    
    return card;
}

// ===== Trainer Screen =====

async function loadPack(pack) {
    try {
        hideError('error-trainer');
        
        // Validate and fetch script
        const scriptPath = validateScriptPath(pack.scriptFile);
        const scriptData = await safeFetchJSON(scriptPath);
        const validatedScript = validateScript(scriptData);
        
        state.currentPack = pack;
        state.currentScript = validatedScript;
        
        // Load progress
        const progress = getPackProgress(pack.id);
        state.currentLineIndex = progress.lastIndex || 0;
        
        // Update UI
        const titleElem = document.getElementById('trainer-title');
        titleElem.textContent = pack.title;
        
        renderLineList();
        updateReviewCount();
        showScreen('trainer');
        
        // Update settings from saved values
        document.getElementById('rate-slider').value = state.settings.rate;
        document.getElementById('gap-slider').value = state.settings.gap;
        updateRateDisplay();
        updateGapDisplay();
        
    } catch (error) {
        showError('error-trainer', error.message);
    }
}

function renderLineList() {
    const container = document.getElementById('line-list');
    container.textContent = '';
    
    const linesToShow = getLinesToShow();
    
    if (linesToShow.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No lines in review queue.';
        message.style.padding = '1rem';
        message.style.color = 'var(--text-muted)';
        container.appendChild(message);
        return;
    }
    
    linesToShow.forEach((line, idx) => {
        const lineItem = createLineItem(line, idx);
        container.appendChild(lineItem);
    });
    
    // Scroll to current line
    scrollToCurrentLine();
}

function getLinesToShow() {
    if (state.reviewOnlyMode) {
        const progress = getPackProgress(state.currentPack.id);
        return progress.reviewQueue.map(idx => ({
            ...state.currentScript[idx],
            originalIndex: idx
        }));
    }
    return state.currentScript.map((line, idx) => ({ ...line, originalIndex: idx }));
}

function createLineItem(line, displayIndex) {
    const item = document.createElement('div');
    item.className = 'line-item';
    
    const actualIndex = line.originalIndex !== undefined ? line.originalIndex : displayIndex;
    
    if (actualIndex === state.currentLineIndex) {
        item.classList.add('active');
    }
    
    item.addEventListener('click', () => {
        selectLine(actualIndex);
    });
    
    const role = document.createElement('div');
    role.className = 'line-role';
    role.textContent = line.role;
    item.appendChild(role);
    
    const text = document.createElement('div');
    text.className = 'line-text';
    text.textContent = line.text;
    item.appendChild(text);
    
    return item;
}

function selectLine(index) {
    if (index < 0 || index >= state.currentScript.length) return;
    
    state.currentLineIndex = index;
    
    // Update progress
    const progress = getPackProgress(state.currentPack.id);
    progress.lastIndex = index;
    saveProgress();
    
    // Update UI
    updateLineSelection();
    clearDictation();
}

function updateLineSelection() {
    const items = document.querySelectorAll('.line-item');
    items.forEach((item, idx) => {
        item.classList.remove('active', 'playing');
        
        const linesToShow = getLinesToShow();
        if (linesToShow[idx] && linesToShow[idx].originalIndex === state.currentLineIndex) {
            item.classList.add('active');
        }
    });
}

function scrollToCurrentLine() {
    const activeItem = document.querySelector('.line-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function updateReviewCount() {
    const progress = getPackProgress(state.currentPack.id);
    const countElem = document.getElementById('review-count');
    countElem.textContent = progress.reviewQueue.length;
}

// ===== TTS Functions =====

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    state.voices = voices.filter(v => v.lang.startsWith('en'));
    
    const select = document.getElementById('voice-select');
    select.textContent = '';
    
    if (state.voices.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No English voices found';
        select.appendChild(option);
        return;
    }
    
    state.voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(option);
    });
    
    // Select saved voice or default
    if (state.settings.voiceURI) {
        select.value = state.settings.voiceURI;
    }
}

function getSelectedVoice() {
    const voiceURI = document.getElementById('voice-select').value;
    return state.voices.find(v => v.voiceURI === voiceURI) || state.voices[0];
}

function speakLine(index, onEnd = null) {
    if (index < 0 || index >= state.currentScript.length) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const line = state.currentScript[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    
    const voice = getSelectedVoice();
    if (voice) {
        utterance.voice = voice;
    }
    
    utterance.rate = parseFloat(document.getElementById('rate-slider').value);
    
    utterance.onstart = () => {
        highlightPlayingLine(index);
        updatePlayerStatus(`Playing line ${index + 1}/${state.currentScript.length}`);
    };
    
    utterance.onend = () => {
        removePlayingHighlight();
        updatePlayerStatus('');
        if (onEnd) onEnd();
    };
    
    utterance.onerror = (event) => {
        updatePlayerStatus(`Speech error: ${event.error}`, 'error');
        removePlayingHighlight();
    };
    
    speechSynthesis.speak(utterance);
}

function highlightPlayingLine(index) {
    removePlayingHighlight();
    
    const items = document.querySelectorAll('.line-item');
    const linesToShow = getLinesToShow();
    
    items.forEach((item, idx) => {
        if (linesToShow[idx] && linesToShow[idx].originalIndex === index) {
            item.classList.add('playing');
        }
    });
}

function removePlayingHighlight() {
    document.querySelectorAll('.line-item.playing').forEach(item => {
        item.classList.remove('playing');
    });
}

function updatePlayerStatus(message, type = '') {
    const status = document.getElementById('player-status');
    status.textContent = message;
    status.className = type ? `status-text ${type}` : 'status-text';
}

function playCurrentLine() {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    speakLine(state.currentLineIndex, () => {
        state.isPlaying = false;
    });
}

function playSequence() {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    
    function playNext() {
        if (!state.isPlaying || state.currentLineIndex >= state.currentScript.length) {
            state.isPlaying = false;
            return;
        }
        
        speakLine(state.currentLineIndex, () => {
            if (!state.isPlaying) return;
            
            const gap = parseInt(document.getElementById('gap-slider').value);
            setTimeout(() => {
                if (state.isPlaying) {
                    state.currentLineIndex++;
                    updateLineSelection();
                    scrollToCurrentLine();
                    playNext();
                }
            }, gap);
        });
    }
    
    playNext();
}

function pausePlayback() {
    state.isPlaying = false;
    speechSynthesis.cancel();
    removePlayingHighlight();
    updatePlayerStatus('Paused');
}

function nextLine() {
    if (state.currentLineIndex < state.currentScript.length - 1) {
        selectLine(state.currentLineIndex + 1);
    }
}

function prevLine() {
    if (state.currentLineIndex > 0) {
        selectLine(state.currentLineIndex - 1);
    }
}

function replayCurrentLine() {
    speakLine(state.currentLineIndex);
}

// ===== Dictation Functions =====

function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/'/g, "'");
}

function checkDictation() {
    const input = document.getElementById('dictation-input').value;
    const targetLine = state.currentScript[state.currentLineIndex];
    
    if (!input.trim()) {
        showStatus('dictation-status', 'Please type something first', 'error');
        return;
    }
    
    const normalizedInput = normalizeText(input);
    const normalizedTarget = normalizeText(targetLine.text);
    
    const inputWords = normalizedInput.split(' ');
    const targetWords = normalizedTarget.split(' ');
    
    // Simple word-by-word comparison
    const diff = computeDiff(inputWords, targetWords);
    renderDiff(diff);
    
    // Calculate score
    const correctWords = diff.filter(d => d.type === 'equal').length;
    const score = targetWords.length > 0 
        ? Math.round((correctWords / targetWords.length) * 100)
        : 0;
    
    document.getElementById('score-value').textContent = `${score}%`;
    
    // Update stats
    updateLineStats(state.currentPack.id, state.currentLineIndex, score);
    updateReviewCount();
    
    // Show status
    if (score >= 90) {
        showStatus('dictation-status', 'Great job! 🎉', 'success');
    } else {
        showStatus('dictation-status', 'Added to review queue. Keep practicing!', 'error');
    }
}

function computeDiff(inputWords, targetWords) {
    // Simple diff algorithm - not optimal but works for MVP
    const result = [];
    let i = 0, j = 0;
    
    while (i < inputWords.length || j < targetWords.length) {
        if (i >= inputWords.length) {
            // Missing words
            result.push({ type: 'insert', word: targetWords[j] });
            j++;
        } else if (j >= targetWords.length) {
            // Extra words
            result.push({ type: 'delete', word: inputWords[i] });
            i++;
        } else if (inputWords[i] === targetWords[j]) {
            // Match
            result.push({ type: 'equal', word: targetWords[j] });
            i++;
            j++;
        } else {
            // Mismatch - check if it's substitution or insertion/deletion
            const nextInputMatch = inputWords.indexOf(targetWords[j], i + 1);
            const nextTargetMatch = targetWords.indexOf(inputWords[i], j + 1);
            
            if (nextInputMatch !== -1 && (nextTargetMatch === -1 || nextInputMatch < nextTargetMatch)) {
                // User has extra word
                result.push({ type: 'delete', word: inputWords[i] });
                i++;
            } else if (nextTargetMatch !== -1) {
                // User is missing word
                result.push({ type: 'insert', word: targetWords[j] });
                j++;
            } else {
                // Substitution
                result.push({ type: 'delete', word: inputWords[i] });
                result.push({ type: 'insert', word: targetWords[j] });
                i++;
                j++;
            }
        }
    }
    
    return result;
}

function renderDiff(diff) {
    const container = document.getElementById('diff-display');
    container.textContent = ''; // Clear safely
    
    diff.forEach((item, idx) => {
        let node;
        
        if (item.type === 'equal') {
            node = document.createElement('span');
            node.className = 'correct';
            node.textContent = item.word;
        } else if (item.type === 'delete') {
            node = document.createElement('del');
            node.textContent = item.word;
        } else if (item.type === 'insert') {
            node = document.createElement('ins');
            node.textContent = item.word;
        }
        
        container.appendChild(node);
        
        // Add space between words (except last)
        if (idx < diff.length - 1) {
            container.appendChild(document.createTextNode(' '));
        }
    });
}

function clearDictation() {
    document.getElementById('dictation-input').value = '';
    document.getElementById('score-value').textContent = '-';
    document.getElementById('diff-display').textContent = '';
    document.getElementById('dictation-status').textContent = '';
}

// ===== Settings Functions =====

function updateRateDisplay() {
    const rate = document.getElementById('rate-slider').value;
    document.getElementById('rate-value').textContent = rate;
    state.settings.rate = parseFloat(rate);
    saveSettings();
}

function updateGapDisplay() {
    const gap = document.getElementById('gap-slider').value;
    document.getElementById('gap-value').textContent = gap;
    state.settings.gap = parseInt(gap);
    saveSettings();
}

function updateVoiceSetting() {
    const voiceURI = document.getElementById('voice-select').value;
    state.settings.voiceURI = voiceURI;
    saveSettings();
}

function updateSettingsDisplay() {
    document.getElementById('settings-rate').textContent = state.settings.rate;
    document.getElementById('settings-gap').textContent = state.settings.gap;
    
    const voice = state.voices.find(v => v.voiceURI === state.settings.voiceURI);
    document.getElementById('settings-voice').textContent = voice ? voice.name : 'Default';
}

function toggleReviewMode() {
    state.reviewOnlyMode = document.getElementById('review-only-mode').checked;
    renderLineList();
    
    // Reset to first line in current view
    const linesToShow = getLinesToShow();
    if (linesToShow.length > 0) {
        selectLine(linesToShow[0].originalIndex);
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Navigation
    document.getElementById('btn-settings').addEventListener('click', () => {
        updateSettingsDisplay();
        showScreen('settings');
    });
    
    document.getElementById('btn-back-trainer').addEventListener('click', () => {
        pausePlayback();
        showScreen('home');
        loadPackList(); // Refresh to show updated progress
    });
    
    document.getElementById('btn-back-settings').addEventListener('click', () => {
        showScreen('home');
    });
    
    // Player controls
    document.getElementById('btn-play').addEventListener('click', playSequence);
    document.getElementById('btn-pause').addEventListener('click', pausePlayback);
    document.getElementById('btn-next').addEventListener('click', nextLine);
    document.getElementById('btn-prev').addEventListener('click', prevLine);
    
    // Player settings
    document.getElementById('rate-slider').addEventListener('input', updateRateDisplay);
    document.getElementById('gap-slider').addEventListener('input', updateGapDisplay);
    document.getElementById('voice-select').addEventListener('change', updateVoiceSetting);
    
    // Dictation
    document.getElementById('btn-replay').addEventListener('click', replayCurrentLine);
    document.getElementById('btn-check').addEventListener('click', checkDictation);
    
    // Review mode
    document.getElementById('review-only-mode').addEventListener('change', toggleReviewMode);
    
    // Settings
    document.getElementById('btn-reset-data').addEventListener('click', resetAllData);
    
    // Voice loading
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

// ===== Initialization =====

function init() {
    loadSettings();
    loadProgress();
    setupEventListeners();
    loadVoices();
    loadPackList();
    
    console.log('Travel English Trainer initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
