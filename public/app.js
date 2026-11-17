document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const typingIndicator = document.getElementById('typing-indicator');
  const quickChips = document.getElementById('quick-chips');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const apiKeyInput = document.getElementById('api-key-input');

  const history = [];

  // Load saved API key from localStorage if any
  const savedKey = localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key') || '';
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  // Settings modal events
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('ai_api_key', key);
      const isGpt = key.startsWith('sk-');
      alert(isGpt ? 'OpenAI GPT API 키가 저장되었습니다.' : 'API 키가 저장되었습니다.');
    } else {
      localStorage.removeItem('ai_api_key');
      localStorage.removeItem('gemini_api_key');
      alert('저장된 API 키가 초기화되었습니다. (환경변수 또는 기본 내장 엔진 사용)');
    }
    settingsModal.style.display = 'none';
  });

  // Handle Quick Chips
  quickChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const msg = chip.getAttribute('data-msg');
    if (msg) {
      userInput.value = msg;
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Submit message
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Render User Message
    appendMessage('user', message);
    userInput.value = '';
    userInput.focus();

    // Show typing indicator
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const apiKey = localStorage.getItem('ai_api_key') || '';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          apiKey
        })
      });

      if (!response.ok) {
        let errMsg = `서버 오류 (${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      const reply = data.reply || '답변을 불러오지 못했어. 다시 한번 말해줄래?';

      // Record in history
      history.push({ role: 'user', text: message });
      history.push({ role: 'model', text: reply });

      // Render AI Message
      appendMessage('ai', reply);
    } catch (err) {
      console.error('Chat error:', err);
      appendMessage('ai', '어라, 서버 연결에 잠깐 문제가 생긴 것 같아. 잠시 후에 다시 이야기해 줄래?');
    } finally {
      typingIndicator.style.display = 'none';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  function appendMessage(sender, text) {
    const row = document.createElement('div');
    row.className = `message-row ${sender === 'user' ? 'user-row' : 'ai-row'}`;

    if (sender === 'ai') {
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.textContent = '🌱';
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'}`;

    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.textContent = p;
        bubble.appendChild(pEl);
      });
    } else {
      bubble.textContent = text;
    }

    row.appendChild(bubble);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
