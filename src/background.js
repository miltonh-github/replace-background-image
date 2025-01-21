"use strict";

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
    chrome.tabs.sendMessage(tab.id, { message: info.menuItemId })
      .then(() => {})
      .catch(() => {});
  });
}
createContextMenu()
