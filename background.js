// 右クリックメニューの作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copyCitation",
    title: "引用形式でコピー",
    contexts: ["selection"]
  });
});

// メニュークリック時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copyCitation") {
    // content scriptが読み込まれているか確認してからメッセージを送信
    chrome.tabs.sendMessage(tab.id, {
      action: "getCitation",
      selectedText: info.selectionText
    }).catch((error) => {
      // エラーが発生した場合は、content scriptを再注入
      console.log("Content script not ready, injecting...");
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        // 再注入後にメッセージを再送信
        chrome.tabs.sendMessage(tab.id, {
          action: "getCitation",
          selectedText: info.selectionText
        });
      }).catch((err) => {
        console.error("Failed to inject content script:", err);
      });
    });
  }
});