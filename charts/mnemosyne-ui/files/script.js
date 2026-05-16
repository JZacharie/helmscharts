// Migration check for old internal URLs
const savedMnemosyneUrl = localStorage.getItem('mnemosyneUrl');
if (savedMnemosyneUrl && savedMnemosyneUrl.includes('.local')) {
  localStorage.removeItem('mnemosyneUrl');
}

const state = {
  mnemosyneUrl: localStorage.getItem('mnemosyneUrl') || 'http://localhost:8080',
  ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
  ollamaModel: localStorage.getItem('ollamaModel') || 'llama3',
  results: []
};

// Elements
const searchBar = document.getElementById('searchBar');
const resultsList = document.getElementById('resultsList');
const synthesizeBtn = document.getElementById('synthesizeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const saveSettingsBtn = document.getElementById('saveSettings');

// Initialize settings inputs
document.getElementById('mnemosyneInput').value = state.mnemosyneUrl;
document.getElementById('ollamaUrlInput').value = state.ollamaUrl;
document.getElementById('ollamaModelInput').value = state.ollamaModel;

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
    resultsList.innerHTML = `<div class="error">Error: ${err.message}. Check your Mnemosyne URL and CORS settings.</div>`;
  }
}

function renderResults(results) {
  resultsList.innerHTML = '';
  
  if (results.length === 0) {
    resultsList.innerHTML = '<div class="no-results">No documents found for this query.</div>';
    return;
  }

  results.forEach((res, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const relevance = Math.round(res.score * 100);
    
    card.innerHTML = `
      <div class="result-header">
        <div class="result-title">${res.source.split('/').pop()}</div>
        <div class="result-relevance">${relevance}% Relevance</div>
      </div>
      <div class="result-content">${res.content}</div>
      <div class="result-footer">
        <div class="result-source">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
          ${res.source}
        </div>
        <button class="btn-ai" onclick="askAiAboutThis(${index})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          Analyze
        </button>
      </div>
    `;
    resultsList.appendChild(card);
  });
}

async function synthesizeResults() {
  if (state.results.length === 0) return;
  
  const query = searchBar.value;
  const context = state.results.map(r => r.content).join('\n\n---\n\n');
  
  const aiCard = document.createElement('div');
  aiCard.className = 'ai-answer-card';
  aiCard.innerHTML = `
    <div class="ai-answer-header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      Synthesizing Answer...
    </div>
    <div id="aiResponse" class="ai-response-text">Thinking...</div>
  `;
  resultsList.prepend(aiCard);
  
  try {
    const response = await fetch(`${state.ollamaUrl}/api/generate`, {
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
    
    document.querySelector('.ai-answer-header').innerHTML = `
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
