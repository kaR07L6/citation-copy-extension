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
    chrome.tabs.sendMessage(tab.id, {
      action: "getCitation",
      selectedText: info.selectionText
    });
  }
});