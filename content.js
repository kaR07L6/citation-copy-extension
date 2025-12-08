// 引用番号を管理
let citationCounter = 0;

// ページ情報を取得して引用形式を生成
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCitation") {
    citationCounter++;
    const citation = generateCitation(request.selectedText, citationCounter);
    copyToClipboard(citation);
    showNotification(`引用形式でコピーしました！（引用番号: ${citationCounter}）`);
  }
});

function generateCitation(selectedText, citationNumber) {
  const url = window.location.href;
  const title = document.title;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const accessDate = formatDate(currentDate);
  
  // 著者情報を取得（meta タグから）
  let author = "";
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) {
    author = authorMeta.content;
  }
  
  // サイト名を取得
  let siteName = "";
  const siteNameMeta = document.querySelector('meta[property="og:site_name"]');
  if (siteNameMeta) {
    siteName = siteNameMeta.content;
  }
  
  // 引用テキストの整形
  const formattedText = selectedText.trim();
  
  // 引用形式の生成
  let citation = `"${formattedText}"${citationNumber})

`;
  
  if (author) {
    // 書籍・記事形式（著者あり）
    citation += `${citationNumber}) ${author}著．${title}．${year}．
`;
  } else {
    // Web記事形式（著者なし）
    citation += `${citationNumber}) "${title}"．`;
    if (siteName) {
      citation += `${siteName}．`;
    }
    citation += `${year}．${url}，（参照 ${accessDate}）．`;
  }
  
  return citation;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 2000);
}