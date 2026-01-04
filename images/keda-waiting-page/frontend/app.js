// Configuration
const API_BASE_URL = window.location.origin;
const POLL_INTERVAL = 2000; // 2 seconds
const LOG_POLL_INTERVAL = 3000; // 3 seconds
const MAX_RETRIES = 180; // 6 minutes max wait time

// State
let state = {
    namespace: '',
    deployment: '',
    appName: '',
    targetUrl: '',
    startTime: Date.now(),
    retryCount: 0,
    currentPodName: null,
    logsExpanded: true,
    lastLogTimestamp: null
};

// DOM Elements
const elements = {
    appName: document.getElementById('app-name'),
    podStatus: document.getElementById('pod-status'),
    elapsedTime: document.getElementById('elapsed-time'),
    replicaCount: document.getElementById('replica-count'),
    progressFill: document.getElementById('progress-fill'),
    progressPercent: document.getElementById('progress-percent'),
    logsContainer: document.getElementById('logs-container'),
    toggleLogs: document.getElementById('toggle-logs')
};

// Initialize
function init() {
    // Add SVG gradient definition
    const svg = document.querySelector('.spinner');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#667eea;stop-opacity:1');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#764ba2;stop-opacity:1');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);

    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    state.namespace = params.get('namespace') || '';
    state.deployment = params.get('deployment') || params.get('app') || '';
    state.appName = params.get('name') || state.deployment;
    state.targetUrl = params.get('target') || window.location.origin;

    // Update UI
    elements.appName.textContent = state.appName || 'Application';

    // Setup event listeners
    elements.toggleLogs.addEventListener('click', toggleLogs);

    // Start monitoring
    if (state.namespace && state.deployment) {
        startMonitoring();
    } else {
        showError('Paramètres manquants: namespace et deployment requis');
    }

    // Start elapsed time counter
    setInterval(updateElapsedTime, 1000);
}

// Toggle logs visibility
function toggleLogs() {
    state.logsExpanded = !state.logsExpanded;
    elements.logsContainer.classList.toggle('collapsed', !state.logsExpanded);
    elements.toggleLogs.classList.toggle('collapsed', !state.logsExpanded);
}

// Update elapsed time
function updateElapsedTime() {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    elements.elapsedTime.textContent = minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;
}

// Start monitoring
function startMonitoring() {
    checkStatus();
    setInterval(checkStatus, POLL_INTERVAL);
    setTimeout(() => {
        if (state.currentPodName) {
            fetchLogs();
            setInterval(fetchLogs, LOG_POLL_INTERVAL);
        }
    }, 3000);
}

// Check deployment status
async function checkStatus() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/status/${state.namespace}/${state.deployment}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateStatus(data);

        // Check if ready
        if (data.ready) {
            redirectToApp();
        }

        state.retryCount = 0; // Reset on success
    } catch (error) {
        console.error('Error checking status:', error);
        state.retryCount++;

        if (state.retryCount >= MAX_RETRIES) {
            showError('Timeout: L\'application met trop de temps à démarrer');
        }
    }
}

// Update status UI
function updateStatus(data) {
    // Update pod status
    const statusBadge = elements.podStatus.querySelector('.status-badge');
    if (data.phase === 'Running') {
        statusBadge.textContent = 'En cours';
        statusBadge.className = 'status-badge running';
    } else if (data.phase === 'Pending') {
        statusBadge.textContent = 'En attente';
        statusBadge.className = 'status-badge pending';
    } else if (data.ready) {
        statusBadge.textContent = 'Prêt';
        statusBadge.className = 'status-badge ready';
    }

    // Update replica count
    elements.replicaCount.textContent = `${data.readyReplicas || 0}/${data.replicas || 1}`;

    // Update progress
    let progress = 0;
    if (data.phase === 'Pending') {
        progress = 25;
    } else if (data.phase === 'Running' && !data.ready) {
        progress = 60;
    } else if (data.ready) {
        progress = 100;
    }

    elements.progressFill.style.width = `${progress}%`;
    elements.progressPercent.textContent = `${progress}%`;

    // Store current pod name for logs
    if (data.podName && data.podName !== state.currentPodName) {
        state.currentPodName = data.podName;
        // Clear logs when pod changes
        elements.logsContainer.innerHTML = '<div class="log-line">Nouveau pod détecté, récupération des logs...</div>';
    }
}

// Fetch pod logs
async function fetchLogs() {
    if (!state.currentPodName) return;

    try {
        const url = `${API_BASE_URL}/api/logs/${state.namespace}/${state.currentPodName}`;
        const params = new URLSearchParams();
        if (state.lastLogTimestamp) {
            params.append('sinceTime', state.lastLogTimestamp);
        } else {
            params.append('tailLines', '50');
        }

        const response = await fetch(`${url}?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
            appendLogs(data.logs);
            state.lastLogTimestamp = data.timestamp;
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

// Append logs to container
function appendLogs(logs) {
    // Clear initial message if present
    if (elements.logsContainer.querySelector('.log-line')?.textContent.includes('En attente')) {
        elements.logsContainer.innerHTML = '';
    }

    logs.forEach(log => {
        const logLine = document.createElement('div');
        logLine.className = 'log-line';

        // Classify log level
        const lowerLog = log.toLowerCase();
        if (lowerLog.includes('error') || lowerLog.includes('fatal')) {
            logLine.classList.add('error');
        } else if (lowerLog.includes('warn')) {
            logLine.classList.add('warning');
        } else if (lowerLog.includes('info')) {
            logLine.classList.add('info');
        } else if (lowerLog.includes('success') || lowerLog.includes('ready')) {
            logLine.classList.add('success');
        }

        logLine.textContent = log;
        elements.logsContainer.appendChild(logLine);
    });

    // Auto-scroll to bottom
    elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;

    // Limit log lines to prevent memory issues
    const maxLines = 200;
    while (elements.logsContainer.children.length > maxLines) {
        elements.logsContainer.removeChild(elements.logsContainer.firstChild);
    }
}

// Redirect to application
function redirectToApp() {
    // Show success state
    const statusBadge = elements.podStatus.querySelector('.status-badge');
    statusBadge.textContent = 'Prêt ✓';
    statusBadge.className = 'status-badge ready';

    elements.progressFill.style.width = '100%';
    elements.progressPercent.textContent = '100%';

    // Add success message to logs
    const successMsg = document.createElement('div');
    successMsg.className = 'log-line success';
    successMsg.textContent = '✓ Application prête! Redirection en cours...';
    elements.logsContainer.appendChild(successMsg);

    // Redirect after a short delay
    setTimeout(() => {
        window.location.href = state.targetUrl;
    }, 1500);
}

// Show error
function showError(message) {
    const statusBadge = elements.podStatus.querySelector('.status-badge');
    statusBadge.textContent = 'Erreur';
    statusBadge.className = 'status-badge';
    statusBadge.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)';

    const errorMsg = document.createElement('div');
    errorMsg.className = 'log-line error';
    errorMsg.textContent = `✗ ${message}`;
    elements.logsContainer.appendChild(errorMsg);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
