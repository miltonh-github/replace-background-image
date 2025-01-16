"use strict";

var imageEl = null;

// register right click (contextmenu) event on document
document.addEventListener("contextmenu", function (event) {
  imageEl = event.target;
  console.log(imageEl);
}, true);

// register message event (sent from background.js)
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.message) {
    case "replaceImageLocal":
      getInputImage();
      break;
    case "replaceImageUrl":
      getInputURL();
      break;
    case "replaceImageReset":
      resetReplacedImages();
      break;
    case "loadLocalJson":
      loadLocalJson();
      break;
    case "saveLocalJson":
      saveLocalJson();
      break;
  }
  return true;
});

// gets image using file input
function getInputImage() {
  if (!isBackgroundImage()) {
    return;
  }
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.addEventListener("change", function (e) {
    readInputImage(this.files[0]);
  }, false);

  fileInput.click();
}

// reads image using FileReader
function readInputImage(file) {
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    replaceImage(reader.result);
  };
}

// gets the input url from user
function getInputURL() {
  if (!isBackgroundImage()) {
    return;
  }
  const URL = prompt('Enter the Image URL:');
  if(!isValidUrl(URL)) {
    alert('Provided URL is Invalid');
    return;
  }
  replaceImage(URL);
}

// Reset all replaced images
function resetReplacedImages() {
  // Delete everything in the replacedImages IndexedDB
  const transaction = db.transaction(['replacedImages'], 'readwrite');
  const objectStore = transaction.objectStore('replacedImages');
  const request = objectStore.clear();

  request.onsuccess = function() {
    alert("All replaced images successfully reset. Reloading...");
    // Clear replacedImages Map
    replacedImages.clear();
    // // Reset all images to their original state
    // const allImages = document.querySelectorAll('*');
    // allImages.forEach(img => {
    //   img.style.backgroundImage = '';
    // });

    // Refresh the page
    location.reload();
  };
}

// checks whether the URL is valid
function isValidUrl(string) {
  try { return Boolean(new URL(string)); }
  catch (e) { return false; }
}

// check if the element right clicked has a background-image.
function isBackgroundImage() {
  console.log('Tag: ' + imageEl.tagName);
  if (imageEl && imageEl.style.backgroundImage) {
    // confirm('Selected element: ' + imageEl.tagName + ' has background-image property: ' + imageEl.style.backgroundImage);
    confirm('Selected element has background-image: ' + imageEl.style.backgroundImage + '. Proceed?');
    return true;
  }
  // IMG detection code. imgs shouldn't cause contextmenus to appear atm so commenting this out for now
  // if (imageEl && imageEl.tagName === 'IMG') {
  //   alert('Selected element is an image. Please select an element with background-image property.');
  //   return false;
  // }
  alert('No background-image found. Please select an element with background-image property.');
  return false;
}

// # Save/load JSON related code
// Load a JSON file with image replacements
function loadLocalJson() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.addEventListener("change", function (e) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
  try {
    const json = JSON.parse(reader.result);
    for (const [oldSrc, newSrc] of Object.entries(json)) {
      replacedImages.set(oldSrc, newSrc);
      saveReplacedImage(oldSrc, newSrc);
    }
    applyReplacedImagesToAll();
    alert("Image replacements loaded from JSON.");
  } catch (error) {
    console.error("Error parsing JSON file:", error);
    alert("Failed to load JSON file.");
  }
    };
  }, false);

  fileInput.click();
}

// Save a JSON file with image replacements
function saveLocalJson() {
  const json = {};
  replacedImages.forEach((newSrc, oldSrc) => {
    json[oldSrc] = newSrc;
  });
  const jsonStr = JSON.stringify(json, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "image_replacements.json";
  a.click();
  URL.revokeObjectURL(url);
}

// # DB and image replacement related code
// Store replaced images
const replacedImages = new Map();

// Open IndexedDB database
let db;

function openDatabase() {
  const request = indexedDB.open('ReplacedImagesDB', 1);

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('replacedImages', { keyPath: 'oldSrc' });
    objectStore.createIndex('newSrc', 'newSrc', { unique: false });
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    loadReplacedImages();
  };

  request.onerror = function(event) {
    console.error('IndexedDB error:', event.target.errorCode);
  };
}

// Save replaced images to IndexedDB
function saveReplacedImage(oldSrc, newSrc) {
  const transaction = db.transaction(['replacedImages'], 'readwrite');
  const objectStore = transaction.objectStore('replacedImages');
  const request = objectStore.put({ oldSrc: oldSrc, newSrc: newSrc });

  request.onsuccess = function() {
    console.log('Replaced image saved to IndexedDB');
  };

  request.onerror = function(event) {
    console.error('Error saving replaced image to IndexedDB:', event.target.errorCode);
  };
}

// Load replaced images from IndexedDB
function loadReplacedImages() {
  const transaction = db.transaction(['replacedImages'], 'readonly');
  const objectStore = transaction.objectStore('replacedImages');
  const request = objectStore.getAll();

  request.onsuccess = function(event) {
    const replacedImagesArray = event.target.result;
    replacedImagesArray.forEach(item => {
      replacedImages.set(item.oldSrc, item.newSrc);
    });
    applyReplacedImagesToAll();
  };

  request.onerror = function(event) {
    console.error('Error loading replaced images from IndexedDB:', event.target.errorCode);
  };
}

// Observe new elements being added to the DOM and existing ones
const imageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Ensure it's an element node
        applyReplacedImages(node);
      }
    });
  });
  // Check existing elements for replaced images
  document.querySelectorAll('*').forEach((node) => {
    if (node.nodeType === 1) { // Ensure it's an element node
      const bgImage = node.style.backgroundImage;
      if (replacedImages.has(bgImage)) {
        node.style.backgroundImage = replacedImages.get(bgImage);
      }
    }
  });
});

// Apply replaced images to a given element
function applyReplacedImages(element) {
  replacedImages.forEach((newSrc, oldSrc) => {
    if (element.style.backgroundImage === oldSrc) {
      element.style.backgroundImage = newSrc;
    }
  });
}

// Apply replaced images to all existing elements
function applyReplacedImagesToAll() {
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    applyReplacedImages(element);
  });
}

// Update replaceImage function to store replaced images
function replaceImage(source) {
  if (!source || !imageEl) {
    return;
  }

  const oldBackgroundImage = imageEl.style.backgroundImage;

  // Replace the clicked image
  imageEl.style.backgroundImage = `url(${source})`;

  // Store the replacement
  replacedImages.set(oldBackgroundImage, `url(${source})`);
  saveReplacedImage(oldBackgroundImage, `url(${source})`);

  // Replace any other images with the same backgroundImage
  const allImages = document.querySelectorAll('*');
  allImages.forEach(img => {
    if (img.style.backgroundImage === oldBackgroundImage) {
      img.style.backgroundImage = `url(${source})`;
    }
  });
}

// Start observing the document
imageObserver.observe(document.body, { childList: true, subtree: true });
console.log("Image observer started");

// Open the IndexedDB database on startup
openDatabase();