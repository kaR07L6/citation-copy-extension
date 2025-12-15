// 引用番号
let citationCounter = 0;

// 設定を取得
let settings = {
  citationStyle: 'japanese',
  autoIncrement: true,
  showNotification: true,
  saveHistory: true
};

// 設定をロード
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = result.settings;
  }
});

// 設定変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    settings = changes.settings.newValue;
  }
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCitation") {
    if (settings.autoIncrement) {
      citationCounter++;
    }
    
    const style = request.style || settings.citationStyle;
    const citation = generateCitation(request.selectedText, citationCounter, style);
    copyToClipboard(citation);
    
    if (settings.showNotification) {
      showNotification(`引用形式でコピーしました（${getStyleName(style)}、引用番号: ${citationCounter}）`);
    }
    
    // 履歴に保存
    if (settings.saveHistory) {
      saveCitationToHistory(citation, style);
    }
  }
});

function generateCitation(selectedText, citationNumber, style) {
  const url = window.location.href;
  const title = document.title;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const accessDate = formatDate(currentDate);
  
  // 著者情報の取得
  const author = getAuthor();
  const siteName = getSiteName();
  const formattedText = selectedText.trim();
  
  switch(style) {
    case 'apa':
      return generateAPACitation(formattedText, author, title, year, url, accessDate, citationNumber);
    case 'mla':
      return generateMLACitation(formattedText, author, title, url, accessDate, citationNumber);
    case 'chicago':
      return generateChicagoCitation(formattedText, author, title, year, url, accessDate, citationNumber);
    case 'ieee':
      return generateIEEECitation(formattedText, author, title, year, url, accessDate, citationNumber);
    case 'japanese':
    default:
      return generateJapaneseCitation(formattedText, author, title, siteName, year, url, accessDate, citationNumber);
  }
}

function generateJapaneseCitation(text, author, title, siteName, year, url, accessDate, num) {
  let citation = `"${text}"${num})

`;
  
  if (author) {
    citation += `${num}) ${author}著．${title}．${year}．
`;
  } else {
    citation += `${num}) "${title}"．`;
    if (siteName) {
      citation += `${siteName}．`;
    }
    citation += `${year}．${url}，（参照 ${accessDate}）．`;
  }
  
  return citation;
}

function generateAPACitation(text, author, title, year, url, accessDate, num) {
  const authorName = author || "Unknown Author";
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let citation = `"${text}" (${authorName}, ${year})

`;
  citation += `${authorName}. (${year}). ${title}. Retrieved ${formattedDate}, from ${url}`;
  
  return citation;
}

function generateMLACitation(text, author, title, url, accessDate, num) {
  const authorName = author || "Unknown Author";
  const domain = new URL(url).hostname;
  
  let citation = `"${text}" (${authorName})

`;
  citation += `${authorName}. "${title}." ${domain}, ${accessDate}. Web. ${url}`;
  
  return citation;
}

function generateChicagoCitation(text, author, title, year, url, accessDate, num) {
  const authorName = author || "Unknown Author";
  
  let citation = `"${text}"${num}

`;
  citation += `${num}. ${authorName}, "${title}," accessed ${accessDate}, ${url}.`;
  
  return citation;
}

function generateIEEECitation(text, author, title, year, url, accessDate, num) {
  const authorName = author || "Unknown Author";
  
  let citation = `"${text}" [${num}]

`;
  citation += `[${num}] ${authorName}, "${title}," ${year}. [Online]. Available: ${url}. [Accessed: ${accessDate}].`;
  
  return citation;
}

function getAuthor() {
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) return authorMeta.content;
  
  const articleAuthor = document.querySelector('meta[property="article:author"]');
  if (articleAuthor) return articleAuthor.content;
  
  return "";
}

function getSiteName() {
  const siteNameMeta = document.querySelector('meta[property="og:site_name"]');
  if (siteNameMeta) return siteNameMeta.content;
  
  return "";
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStyleName(style) {
  const styles = {
    'japanese': '日本語形式',
    'apa': 'APA形式',
    'mla': 'MLA形式',
    'chicago': 'Chicago形式',
    'ieee': 'IEEE形式'
  };
  return styles[style] || '日本語形式';
}

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

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000000;
    color: #00ff00;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: sans-serif;
    font-size: 14px;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2000);
}

function saveCitationToHistory(citation, style) {
  const citationData = {
    text: citation,
    style: style,
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({
    action: "saveCitation",
    citation: citationData
  });
}