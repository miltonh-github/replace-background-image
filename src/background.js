"use strict";

function createContextMenu() {

  chrome.contextMenus.create({
    id: "replaceimage",
    title: "Background Image Replacer",
  });

  chrome.contextMenus.create({
    id: "saveLoad",
    title: "Save/Load",
  });

  chrome.contextMenus.create({
    id: "replaceImageLocal",
    title: "Local File",
    parentId: "replaceimage",
  });
  
  chrome.contextMenus.create({
    id: "replaceImageUrl",
    title: "URL",
    parentId: "replaceimage",
  });

  chrome.contextMenus.create({
    id: "replaceImageReset",
    title: "Reset all replaced images",
  });

  chrome.contextMenus.create({
    id: "loadLocalJson",
    title: "Load Local JSON",
    parentId: "saveLoad",
  });

  chrome.contextMenus.create({
    id: "saveLocalJson",
    title: "Save Local JSON",
    parentId: "saveLoad",
  });



  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    chrome.tabs.sendMessage(tab.id, { message: info.menuItemId })
      .then(() => {})
      .catch(() => {});
  });
}
createContextMenu()
