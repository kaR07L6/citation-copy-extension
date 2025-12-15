// デフォルト設定
const DEFAULT_SETTINGS = {
  citationStyle: 'japanese',
  autoIncrement: true,
  showNotification: true,
  saveHistory: true
};

// 初期化処理
chrome.runtime.onInstalled.addListener(() => {
  // デフォルト設定を保存
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });

  // 引用履歴の初期化
  chrome.storage.local.get(['citations'], (result) => {
    if (!result.citations) {
      chrome.storage.local.set({ citations: [] });
    }
  });

  // コンテキストメニューの作成
  chrome.contextMenus.create({
    id: "copyCitation",
    title: "引用形式でコピー",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "copyWithStyle",
    title: "引用形式を選択してコピー",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "japaneseStyle",
    parentId: "copyWithStyle",
    title: "日本語形式",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "apaStyle",
    parentId: "copyWithStyle",
    title: "APA形式",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "mlaStyle",
    parentId: "copyWithStyle",
    title: "MLA形式",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "chicagoStyle",
    parentId: "copyWithStyle",
    title: "Chicago形式",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "ieeeStyle",
    parentId: "copyWithStyle",
    title: "IEEE形式",
    contexts: ["selection"]
  });
});

// メニュークリック時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuIds = ["copyCitation", "japaneseStyle", "apaStyle", "mlaStyle", "chicagoStyle", "ieeeStyle"];
  
  if (menuIds.includes(info.menuItemId)) {
    let style = "japanese";
    
    if (info.menuItemId === "copyCitation") {
      // デフォルトスタイルを取得
      chrome.storage.sync.get(['settings'], (result) => {
        style = result.settings?.citationStyle || "japanese";
        sendCitationMessage(tab.id, info.selectionText, style);
      });
    } else {
      // 選択されたスタイルを使用
      style = info.menuItemId.replace("Style", "");
      sendCitationMessage(tab.id, info.selectionText, style);
    }
  }
});

function sendCitationMessage(tabId, selectedText, style) {
  chrome.tabs.sendMessage(tabId, {
    action: "getCitation",
    selectedText: selectedText,
    style: style
  }).catch((error) => {
    console.log("Content script not ready, injecting...");
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tabId, {
        action: "getCitation",
        selectedText: selectedText,
        style: style
      });
    }).catch((err) => {
      console.error("Failed to inject content script:", err);
    });
  });
}

// ポップアップからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || DEFAULT_SETTINGS });
    });
    return true;
  }
  
  if (request.action === "saveSettings") {
    chrome.storage.sync.set({ settings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === "getCitations") {
    chrome.storage.local.get(['citations'], (result) => {
      sendResponse({ citations: result.citations || [] });
    });
    return true;
  }
  
  if (request.action === "clearCitations") {
    chrome.storage.local.set({ citations: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === "saveCitation") {
    chrome.storage.local.get(['citations'], (result) => {
      const citations = result.citations || [];
      citations.unshift(request.citation); // 新しい引用を先頭に追加
      
      // 最大100件まで保存
      if (citations.length > 100) {
        citations.pop();
      }
      
      chrome.storage.local.set({ citations: citations }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});