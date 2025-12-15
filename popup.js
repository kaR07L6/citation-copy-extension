// タブ切り替え
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // タブのアクティブ状態を切り替え
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // コンテンツの表示を切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // 履歴タブを開いたら履歴を読み込む
    if (tabName === 'history') {
      loadCitations();
    }
  });
});

// 設定を読み込む
function loadSettings() {
  chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
    if (response && response.settings) {
      const settings = response.settings;
      document.getElementById('citationStyle').value = settings.citationStyle || 'japanese';
      document.getElementById('autoIncrement').checked = settings.autoIncrement !== false;
      document.getElementById('showNotification').checked = settings.showNotification !== false;
      document.getElementById('saveHistory').checked = settings.saveHistory !== false;
    }
  });
}

// 設定を保存
document.getElementById('saveSettings').addEventListener('click', () => {
  const settings = {
    citationStyle: document.getElementById('citationStyle').value,
    autoIncrement: document.getElementById('autoIncrement').checked,
    showNotification: document.getElementById('showNotification').checked,
    saveHistory: document.getElementById('saveHistory').checked
  };
  
  chrome.runtime.sendMessage({ 
    action: "saveSettings", 
    settings: settings 
  }, (response) => {
    if (response && response.success) {
      showSaveIndicator();
    }
  });
});

// 保存インジケーターを表示
function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  indicator.classList.add('show');
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}

// 引用履歴を読み込む
function loadCitations() {
  chrome.runtime.sendMessage({ action: "getCitations" }, (response) => {
    const citationList = document.getElementById('citationList');
    
    if (!response || !response.citations || response.citations.length === 0) {
      citationList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>まだ引用履歴がありません</p>
          <p style="font-size: 12px; margin-top: 10px;">テキストを選択して右クリックで引用を作成できます</p>
        </div>
      `;
      return;
    }
    
    citationList.innerHTML = response.citations.map((citation, index) => {
      const date = new Date(citation.timestamp);
      const formattedDate = date.toLocaleString('ja-JP');
      const styleNames = {
        'japanese': '日本語',
        'apa': 'APA',
        'mla': 'MLA',
        'chicago': 'Chicago',
        'ieee': 'IEEE'
      };
      
      return `
        <div class="citation-item">
          <div class="citation-meta">
            <strong>${citation.title}</strong><br>
            形式: ${styleNames[citation.style] || citation.style} | 日時: ${formattedDate}
          </div>
          <div class="citation-text">${escapeHtml(citation.text)}</div>
          <div class="citation-actions">
            <button class="btn btn-primary btn-small copy-btn" data-index="${index}">
              📋 コピー
            </button>
            <button class="btn btn-secondary btn-small" onclick="window.open('${citation.url}', '_blank')">
              🔗 ページを開く
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // コピーボタンのイベントリスナーを追加
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const citation = response.citations[index];
        copyToClipboard(citation.text);
        
        // ボタンのテキストを一時的に変更
        const originalText = e.target.textContent;
        e.target.textContent = '✓ コピーしました';
        setTimeout(() => {
          e.target.textContent = originalText;
        }, 1500);
      });
    });
  });
}

// 全ての引用をエクスポート
document.getElementById('exportAll').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "getCitations" }, (response) => {
    if (!response || !response.citations || response.citations.length === 0) {
      alert('エクスポートする引用がありません');
      return;
    }
    
    const allCitations = response.citations
      .map((citation, index) => `=== 引用 ${index + 1} ===
${citation.text}
ページ: ${citation.title}
URL: ${citation.url}
日時: ${new Date(citation.timestamp).toLocaleString('ja-JP')}

`)
      .join('\n');
    
    copyToClipboard(allCitations);
    showSaveIndicator();
  });
});

// 履歴をクリア
document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('本当に全ての引用履歴を削除しますか？')) {
    chrome.runtime.sendMessage({ action: "clearCitations" }, (response) => {
      if (response && response.success) {
        loadCitations();
        showSaveIndicator();
      }
    });
  }
});

// クリップボードにコピー
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初期化
loadSettings();
