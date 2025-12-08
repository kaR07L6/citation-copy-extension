// 引用番号を管理（ページごと）
let citationCounter = 0;

// background からのメッセージ受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCitation") {
    citationCounter++;

    const citation = generateCitation(request.selectedText, citationCounter);
    copyToClipboard(citation);
    showNotification(`引用形式でコピーしました！（No.${citationCounter}）`);
  }
});

// 引用生成ロジック
function generateCitation(selectedText, citationNumber) {
  const url = window.location.href;
  const title = document.title;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const accessDate = formatDate(currentDate);

  // 著者情報
  let author = "";
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) author = authorMeta.content;

  // サイト名
  let siteName = "";
  const siteNameMeta = document.querySelector('meta[property="og:site_name"]');
  if (siteNameMeta) siteName = siteNameMeta.content;

  const formatted = selectedText.trim();

  let citation = `"${formatted}"（${citationNumber}）\n\n`;

  if (author) {
    citation += `${citationNumber}) ${author} 著『${title}』${year}年。\n`;
  } else {
    citation += `${citationNumber}) 「${title}」`;
    if (siteName) citation += `（${siteName}）`;
    citation += ` ${year}年。${url}（参照 ${accessDate}）。`;
  }

  return citation;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showNotification(message) {
  const box = document.createElement("div");
  box.textContent = message;
  box.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 999999;
    font-size: 14px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(box);

  setTimeout(() => box.remove(), 2000);
}
