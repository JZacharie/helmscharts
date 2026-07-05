// Migration check for old internal or subdomain URLs
const savedMnemosyneUrl = localStorage.getItem('mnemosyneUrl');
if (savedMnemosyneUrl && (savedMnemosyneUrl.includes('.local') || savedMnemosyneUrl.includes('api-mnemosyne'))) {
  localStorage.removeItem('mnemosyneUrl');
}

const state = {
  mnemosyneUrl: localStorage.getItem('mnemosyneUrl') || 'http://localhost:8080',
  ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://192.168.0.58:11434',
  ollamaModel: localStorage.getItem('ollamaModel') || 'llama3.1:8b',
  results: []
};

// Elements
const searchBar = document.getElementById('searchBar');
const resultsList = document.getElementById('resultsList');
const synthesizeBtn = document.getElementById('synthesizeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const saveSettingsBtn = document.getElementById('saveSettings');

// Navigation Tabs
const searchTabBtn = document.getElementById('searchTabBtn');
const pipelineTabBtn = document.getElementById('pipelineTabBtn');
const searchPanel = document.getElementById('searchPanel');
const pipelinePanel = document.getElementById('pipelinePanel');

// Details Drawer
const runDetailsDrawer = document.getElementById('runDetailsDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const submitCorrectionBtn = document.getElementById('submitCorrectionBtn');
let currentRunId = null;

// Initialize settings inputs
document.getElementById('mnemosyneInput').value = state.mnemosyneUrl;
document.getElementById('ollamaUrlInput').value = state.ollamaUrl;
document.getElementById('ollamaModelInput').value = state.ollamaModel;

// Tab Switch Logic
searchTabBtn.addEventListener('click', () => {
  searchTabBtn.classList.add('active');
  pipelineTabBtn.classList.remove('active');
  searchPanel.style.display = 'flex';
  pipelinePanel.style.display = 'none';
});

pipelineTabBtn.addEventListener('click', () => {
  pipelineTabBtn.classList.add('active');
  searchTabBtn.classList.remove('active');
  searchPanel.style.display = 'none';
  pipelinePanel.style.display = 'block';
  loadPipelineRuns();
});

// Search function
async function performSearch(query) {
  if (!query) return;
  
  resultsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  synthesizeBtn.style.display = 'none';

  try {
    const response = await fetch(`${state.mnemosyneUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error('Failed to fetch from Mnemosyne');

    const data = await response.json();
    state.results = data.results;
    renderResults(data.results);
    
    if (data.results.length > 0) {
      synthesizeBtn.style.display = 'flex';
    }
  } catch (err) {
    resultsList.innerHTML = `<div class="error" style="color: #ef4444; padding: 2rem; text-align: center;">Error: ${err.message}. Check your Mnemosyne URL and CORS settings.</div>`;
  }
}

function renderResults(results) {
  resultsList.innerHTML = '';
  
  if (results.length === 0) {
    resultsList.innerHTML = '<div class="no-results" style="text-align: center; color: var(--text-secondary); padding: 4rem;">No documents found for this query.</div>';
    return;
  }

  results.forEach((res, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const relevance = Math.round(res.score * 100);
    
    // Header
    const rHeader = document.createElement('div');
    rHeader.className = 'result-header';
    const rTitle = document.createElement('div');
    rTitle.className = 'result-title';
    rTitle.textContent = res.source.split('/').pop();
    const rRel = document.createElement('div');
    rRel.className = 'result-relevance';
    rRel.textContent = `${relevance}% Relevance`;
    rHeader.appendChild(rTitle);
    rHeader.appendChild(rRel);

    // Content
    const rContent = document.createElement('div');
    rContent.className = 'result-content';
    rContent.textContent = res.content;

    // Footer
    const rFooter = document.createElement('div');
    rFooter.className = 'result-footer';
    const rSrc = document.createElement('div');
    rSrc.className = 'result-source';
    rSrc.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
    const rSrcText = document.createTextNode(` ${res.source}`);
    rSrc.appendChild(rSrcText);

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '0.5rem';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-view-file';
    const isPdf = res.source_path && res.source_path.toLowerCase().endsWith('.pdf');
    viewBtn.innerHTML = isPdf
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> View PDF`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> View File`;
    viewBtn.addEventListener('click', () => {
      window.open(`${state.mnemosyneUrl}/api/file?path=${encodeURIComponent(res.source_path)}`, '_blank');
    });

    const rBtn = document.createElement('button');
    rBtn.className = 'btn-ai';
    rBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Analyze`;
    rBtn.addEventListener('click', () => askAiAboutThis(index));

    btnGroup.appendChild(viewBtn);
    btnGroup.appendChild(rBtn);

    rFooter.appendChild(rSrc);
    rFooter.appendChild(btnGroup);

    card.appendChild(rHeader);
    card.appendChild(rContent);
    card.appendChild(rFooter);

    resultsList.appendChild(card);
  });
}

// Ingestion Pipeline Logic
async function loadPipelineRuns() {
  const body = document.getElementById('pipelineRunsBody');
  body.replaceChildren();
  
  const loadingRow = document.createElement('tr');
  const loadingTd = document.createElement('td');
  loadingTd.colSpan = 7;
  loadingTd.style.textAlign = 'center';
  loadingTd.style.padding = '2rem';
  loadingTd.textContent = 'Loading runs...';
  loadingRow.appendChild(loadingTd);
  body.appendChild(loadingRow);

  try {
    const response = await fetch(`${state.mnemosyneUrl}/api/pipeline/runs`);
    if (!response.ok) throw new Error('Failed to load runs');
    const runs = await response.json();

    body.replaceChildren();
    if (runs.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = 7;
      emptyTd.style.textAlign = 'center';
      emptyTd.style.padding = '2rem';
      emptyTd.textContent = 'No pipeline runs recorded yet.';
      emptyRow.appendChild(emptyTd);
      body.appendChild(emptyRow);
      return;
    }

    runs.forEach(run => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.style.fontWeight = '600';
      tdName.textContent = run.file_name;

      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `status-badge ${getStatusClass(run.status)}`;
      badge.textContent = run.status;
      tdStatus.appendChild(badge);

      const tdStep = document.createElement('td');
      tdStep.textContent = run.current_step;

      const tdOcr = document.createElement('td');
      tdOcr.textContent = run.ocr_status;

      const tdChunks = document.createElement('td');
      tdChunks.textContent = run.chunks_count !== null ? run.chunks_count : '-';

      const tdTime = document.createElement('td');
      tdTime.textContent = new Date(run.started_at).toLocaleString();

      const tdActions = document.createElement('td');
      tdActions.style.display = 'flex';
      tdActions.style.gap = '0.35rem';

      const btnInspect = document.createElement('button');
      btnInspect.className = 'btn-ai';
      btnInspect.style.padding = '0.25rem 0.75rem';
      btnInspect.textContent = 'Inspect';
      btnInspect.addEventListener('click', () => showRunDetails(run.id));
      tdActions.appendChild(btnInspect);

      const btnViewFile = document.createElement('a');
      btnViewFile.className = 'btn-view-file';
      btnViewFile.style.padding = '0.25rem 0.75rem';
      btnViewFile.style.fontSize = '0.8rem';
      btnViewFile.style.textDecoration = 'none';
      btnViewFile.href = `${state.mnemosyneUrl}/api/file?path=${encodeURIComponent(run.file_path)}`;
      btnViewFile.target = '_blank';
      btnViewFile.textContent = 'View';
      tdActions.appendChild(btnViewFile);

      tr.appendChild(tdName);
      tr.appendChild(tdStatus);
      tr.appendChild(tdStep);
      tr.appendChild(tdOcr);
      tr.appendChild(tdChunks);
      tr.appendChild(tdTime);
      tr.appendChild(tdActions);

      body.appendChild(tr);
    });
  } catch (err) {
    body.replaceChildren();
    const errRow = document.createElement('tr');
    const errTd = document.createElement('td');
    errTd.colSpan = 7;
    errTd.style.textAlign = 'center';
    errTd.style.padding = '2rem';
    errTd.style.color = '#ef4444';
    errTd.textContent = `Error: ${err.message}`;
    errRow.appendChild(errTd);
    body.appendChild(errRow);
  }
}

function getStatusClass(status) {
  if (status === 'COMPLETED') return 'status-completed';
  if (status === 'FAILED') return 'status-failed';
  return 'status-progress';
}

async function showRunDetails(runId) {
  currentRunId = runId;
  runDetailsDrawer.style.display = 'flex';

  try {
    const response = await fetch(`${state.mnemosyneUrl}/api/pipeline/runs/${runId}`);
    if (!response.ok) throw new Error('Failed to fetch run details');
    const run = await response.json();

    document.getElementById('drawerTitle').textContent = run.file_name;
    document.getElementById('runFilePath').textContent = run.file_path;
    const viewLink = document.getElementById('runFileViewLink');
    viewLink.href = `${state.mnemosyneUrl}/api/file?path=${encodeURIComponent(run.file_path)}`;
    viewLink.style.display = 'inline-flex';
    document.getElementById('runFileSize').textContent = formatBytes(run.file_size);
    document.getElementById('runStartedAt').textContent = new Date(run.started_at).toLocaleString();
    document.getElementById('runCompletedAt').textContent = run.completed_at ? new Date(run.completed_at).toLocaleString() : 'In Progress';
    
    document.getElementById('runExtractedText').value = run.extracted_text || '';

    // Set correction inputs
    if (run.parameters) {
      document.getElementById('correctionChunkSize').value = run.parameters.chunk_size || 1000;
      document.getElementById('correctionChunkOverlap').value = run.parameters.chunk_overlap || 0;
    }

    // Render Timeline Steps
    const timeline = document.getElementById('runTimeline');
    timeline.replaceChildren();

    const steps = [
      { name: 'File Discovery & Ingestion', key: 'SCANNING' },
      { name: 'Text Extraction / OCR', key: 'PARSING' },
      { name: 'Text Chunking & Splitting', key: 'CHUNKING' },
      { name: 'Vector Embedding Generation', key: 'EMBEDDING' },
      { name: 'Vector Store Persistence', key: 'STORING' }
    ];

    const currentStepIdx = getStepIndex(run.current_step, run.status);

    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      if (run.status === 'FAILED' && idx === currentStepIdx) {
        item.className += ' failed';
      } else if (idx < currentStepIdx || (run.status === 'COMPLETED' && idx === steps.length - 1)) {
        item.className += ' success';
      } else if (idx === currentStepIdx) {
        item.className += ' active';
      }

      const dot = document.createElement('div');
      dot.className = 'timeline-dot';

      const content = document.createElement('div');
      content.className = 'timeline-content';

      const stepName = document.createElement('span');
      stepName.className = 'timeline-step-name';
      stepName.textContent = step.name;

      const stepTime = document.createElement('span');
      stepTime.className = 'timeline-step-time';
      
      if (idx === currentStepIdx && run.status === 'FAILED') {
        stepTime.textContent = 'Failed';
        stepTime.style.color = '#ef4444';
      } else if (idx < currentStepIdx) {
        stepTime.textContent = 'Completed';
        stepTime.style.color = '#10b981';
      } else if (idx === currentStepIdx && run.status === 'IN_PROGRESS') {
        stepTime.textContent = 'Processing...';
        stepTime.style.color = '#3b82f6';
      } else if (run.status === 'COMPLETED') {
        stepTime.textContent = 'Completed';
        stepTime.style.color = '#10b981';
      } else {
        stepTime.textContent = 'Pending';
      }

      content.appendChild(stepName);
      content.appendChild(stepTime);
      item.appendChild(dot);
      item.appendChild(content);
      timeline.appendChild(item);
    });

    // Render Chunks
    const chunksList = document.getElementById('runChunksList');
    chunksList.replaceChildren();

    if (run.chunks && Array.isArray(run.chunks)) {
      run.chunks.forEach((chunk, index) => {
        const card = document.createElement('div');
        card.className = 'chunk-card';
        
        const header = document.createElement('div');
        header.style.fontWeight = '700';
        header.style.marginBottom = '0.5rem';
        header.style.color = 'var(--accent-color)';
        header.textContent = `Chunk #${index + 1}`;
        
        const text = document.createElement('div');
        text.textContent = chunk;

        card.appendChild(header);
        card.appendChild(text);
        chunksList.appendChild(card);
      });
    } else {
      const noChunks = document.createElement('div');
      noChunks.style.color = 'var(--text-secondary)';
      noChunks.textContent = 'No chunks generated yet.';
      chunksList.appendChild(noChunks);
    }

  } catch (err) {
    alert(err.message);
  }
}

function getStepIndex(step, status) {
  if (status === 'COMPLETED') return 4;
  if (step === 'SCANNING') return 0;
  if (step === 'PARSING') return 1;
  if (step === 'CHUNKING') return 2;
  if (step === 'EMBEDDING') return 3;
  if (step === 'STORING') return 4;
  return 0;
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Drawer Close
closeDrawerBtn.addEventListener('click', () => {
  runDetailsDrawer.style.display = 'none';
});

// Submit Correction
submitCorrectionBtn.addEventListener('click', async () => {
  if (!currentRunId) return;

  const chunkSize = parseInt(document.getElementById('correctionChunkSize').value);
  const chunkOverlap = parseInt(document.getElementById('correctionChunkOverlap').value);
  const customText = document.getElementById('runExtractedText').value;

  submitCorrectionBtn.disabled = true;
  submitCorrectionBtn.textContent = 'Submitting Correction...';

  try {
    const response = await fetch(`${state.mnemosyneUrl}/api/pipeline/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentRunId,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        custom_text: customText
      })
    });

    if (!response.ok) throw new Error('Failed to request correction');

    alert('Correction submitted! Re-indexing is now running in the background.');
    runDetailsDrawer.style.display = 'none';
    loadPipelineRuns();
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    submitCorrectionBtn.disabled = false;
    submitCorrectionBtn.textContent = 'Re-run Ingestion & Correct';
  }
});

// Refresh Pipeline Button
document.getElementById('refreshPipelineBtn').addEventListener('click', loadPipelineRuns);

async function synthesizeResults() {
  if (state.results.length === 0) return;
  
  const query = searchBar.value;
  const context = state.results.map(r => r.content).join('\n\n---\n\n');
  
  const aiCard = document.createElement('div');
  aiCard.className = 'ai-answer-card';
  
  const header = document.createElement('div');
  header.className = 'ai-answer-header';
  header.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> Synthesizing Answer...`;
  
  const respEl = document.createElement('div');
  respEl.id = 'aiResponse';
  respEl.className = 'ai-response-text';
  respEl.textContent = 'Thinking...';
  
  aiCard.appendChild(header);
  aiCard.appendChild(respEl);
  resultsList.prepend(aiCard);
  
  try {
    const response = await fetch(`${state.mnemosyneUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.ollamaModel,
        prompt: `You are Mnemosyne AI. Based on the following document snippets, answer the question: "${query}"\n\nCONTEXT:\n${context}`,
        stream: true
      })
    });

    if (!response.ok) throw new Error('Ollama connection failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let answer = '';
    const responseEl = document.getElementById('aiResponse');
    responseEl.innerText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.response) {
          answer += data.response;
          responseEl.innerText = answer;
        }
      }
    }
    
    header.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      AI Synthesis Complete
    `;
  } catch (err) {
    document.getElementById('aiResponse').innerText = `Error: ${err.message}. Make sure Ollama is running and accessible.`;
  }
}

// Events
searchBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch(searchBar.value);
});

synthesizeBtn.addEventListener('click', synthesizeResults);

settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
window.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.style.display = 'none'; });

saveSettingsBtn.addEventListener('click', () => {
  state.mnemosyneUrl = document.getElementById('mnemosyneInput').value;
  state.ollamaUrl = document.getElementById('ollamaUrlInput').value;
  state.ollamaModel = document.getElementById('ollamaModelInput').value;
  
  localStorage.setItem('mnemosyneUrl', state.mnemosyneUrl);
  localStorage.setItem('ollamaUrl', state.ollamaUrl);
  localStorage.setItem('ollamaModel', state.ollamaModel);
  
  settingsModal.style.display = 'none';
  alert('Settings saved!');
});
