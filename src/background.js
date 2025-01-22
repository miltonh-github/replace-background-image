function createContextMenu() {
  chrome.contextMenus.create({
    id: "replaceImageLocal",
    title: "Replace with Local File",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "replaceImageUrl",
    title: "Replace with image URL",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "saveLoad",
    title: "Save/Load",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "replaceImageReset",
    title: "Reset all replaced images",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "saveLocalJson",
    title: "Save Local JSON",
    parentId: "saveLoad",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "loadLocalJson",
    title: "Load Local JSON",
    parentId: "saveLoad",
    contexts: ["all"],
  });

  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content.js"]
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, { message: info.menuItemId });
      }).catch(err => console.error(err));
    }
  });
}

createContextMenu();