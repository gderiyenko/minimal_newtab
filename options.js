import { showNotification } from "./widgets/notification.js";

document.addEventListener("DOMContentLoaded", () => {
  const settings_keys = [
    "clock",
    "bookmarks",
    "topRight",
    "topRightOrder",
    "pixelArtDensity",
    "pixelArtColorDark",
    "pixelArtColorLight",
    "theme",
    "backgroundImage",

    "customCSS",
  ];

  let settingsJsonStr = localStorage.getItem("settings") || JSON.stringify(defaultSettings);
  let settings = JSON.parse(settingsJsonStr); settings_keys.forEach((key) => (settings[key] ??= defaultSettings[key]));

  if (settings["clock"]) {
    document.getElementById("show-clock").checked = true;
  }

  settings["bookmarks"]
    ? (document.getElementById("show-bookmarks").checked = true)
    : null;

  settings["topRight"]
    ? (document.getElementById("show-topRight").checked = true)
    : document.querySelector("#shortcuts-links").classList.add("disabled");

  if (settings["customCSS"]) {
    document.getElementById("custom-css").value = settings["customCSS"];
  }

  const theme = localStorage.getItem("theme") || "system";
  if (document.querySelector(`input[name="theme"][value="${theme}"]`)) {
    document.querySelector(`input[name="theme"][value="${theme}"]`).checked =
      true;
  }

  // Handle background image preview
  const bgPreview = document.getElementById("background-preview");
  const imagePresentContainer = document.getElementById(
    "image-present-container",
  );
  const bgAddLabel = document.getElementById("background-add-label");
  const clearBgButton = document.getElementById("clear-background-image");

  // Populate About panel: logo and version + links
  try {
    // Prefer chrome.runtime.getManifest() when available (extension context)
    let manifest = null;
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.getManifest
    ) {
      manifest = chrome.runtime.getManifest();
    }
    if (manifest && manifest.version) {
      document.getElementById("extension-version").textContent =
        manifest.version;
    } else {
      // Fallback: fetch manifest.json relative to the page
      fetch("manifest.json")
        .then((r) => r.json())
        .then((m) => {
          if (m && m.version)
            document.getElementById("extension-version").textContent =
              m.version;
        })
        .catch(() => {
          document.getElementById("extension-version").textContent = "Unknown";
        });
    }
  } catch (e) {
    try {
      fetch("manifest.json")
        .then((r) => r.json())
        .then((m) => {
          if (m && m.version)
            document.getElementById("extension-version").textContent = m.version;
        });
    } catch (ignored) {
      document.getElementById("extension-version").textContent = "Unknown";
    }
  }

  // If the webstore badge image exists, keep it; otherwise the img onerror handler shows the fallback SVG.
  // Add an accessible tooltip using data-tooltip wrappers for consistent styling if desired later.

  if (settings.backgroundImage) {
    bgPreview.src = settings.backgroundImage;
    bgPreview.classList.remove("hidden");
    imagePresentContainer.classList.remove("hidden");
    bgAddLabel.classList.add("hidden");
    clearBgButton.classList.remove("hidden");
  } else {
    bgPreview.classList.add("hidden");
    imagePresentContainer.classList.add("hidden");
    bgAddLabel.classList.remove("hidden");
    clearBgButton.classList.add("hidden");
  }

  if (settings.topRightOrder) {
    let tbody = document.querySelector("table#top-right-links tbody");
    tbody.innerHTML = "";
    settings["topRightOrder"].map((item) => {
      let tr = document.createElement("tr");
      let td1 = document.createElement("td");
      let td1label = document.createElement("label");
      td1label.className = "checkbox-label";
      let td1check = document.createElement("input");
      td1check.type = "checkbox";
      td1check.setAttribute("data-key", item.id);
      td1check.checked = item.displayBool;
      td1label.innerHTML = '<span class="custom-checkbox"></span>';
      td1label.prepend(td1check);
      td1.append(td1label);
      let td2 = document.createElement("td");
      td2.innerHTML = item.id;
      let td3 = document.createElement("td");
      td3.innerHTML = `<span>☰</span>`;
      td3.classList.add("drag-handle");
      tr.innerHTML = "";
      tr.append(td1);
      tr.append(td2);
      tr.append(td3);
      tbody.append(tr);
    });
  }
  const shortcutsTableBody = document.querySelector(
    "table#top-right-links tbody",
  );
  let draggingShortcutRow = null;

  shortcutsTableBody.addEventListener("dragstart", (e) => {
    const row = e.target.closest("tr");
    if (row) {
      draggingShortcutRow = row;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", null); // Necessary for Firefox
      row.classList.add("dragging");
    }
  });

  shortcutsTableBody.addEventListener("dragend", (e) => {
    if (draggingShortcutRow) {
      draggingShortcutRow.classList.remove("dragging");
      draggingShortcutRow = null;
    }
  });

  shortcutsTableBody.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetRow = e.target.closest("tr");
    if (targetRow && targetRow !== draggingShortcutRow) {
      const rect = targetRow.getBoundingClientRect();
      const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
      shortcutsTableBody.insertBefore(
        draggingShortcutRow,
        (next && targetRow.nextSibling) || targetRow,
      );
    }
  });

  shortcutsTableBody.addEventListener("drop", (e) => {
    e.preventDefault();
  });

  // Make rows draggable
  shortcutsTableBody
    .querySelectorAll("tr")
    .forEach((row) => row.setAttribute("draggable", "true"));



  // Back link navigation
  document.getElementById("back-link").addEventListener("click", () => {
    chrome.tabs.update({ url: "chrome://newtab" });
  });

  // Navigate back when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      chrome.tabs.update({ url: "chrome://newtab" });
    }
  });

  let saveBtn = document.getElementById("save");
  saveBtn.addEventListener("click", () => {
    let settings_obj = {};
    settings_keys.map((key) => {
      switch (key) {
        case "topRightOrder":
          let orderArr = [];
          const tbody = document.querySelector("table#top-right-links tbody");
          let trs = tbody.children;
          for (var i = 0; i < trs.length; i++) {
            let tr = tbody.children[i];
            let trType = tr.querySelector("td input").getAttribute("data-key");
            let checkedBool = tr.querySelector("td input").checked;
            orderArr.push({
              id: trType,
              displayBool: checkedBool,
              url:
                trType == "passwords"
                  ? "chrome://password-manager/passwords"
                  : "chrome://" + trType,
            });
          }
          settings_obj["topRightOrder"] = orderArr;
          break;

        case "theme":
          const selectedTheme = document.querySelector(
            'input[name="theme"]:checked',
          ).value;
          localStorage.setItem("theme", selectedTheme);
          break;

        case "backgroundImage":
          settings_obj[key] = settings.backgroundImage || "";
          break;

        case "customCSS":
          // Sanitize: remove </style> tags to prevent breaking out of style block
          const rawCSS = document.getElementById("custom-css").value;
          settings_obj[key] = rawCSS.replace(/<\/style>/gi, "");
          break;

        default:
          try {
            settings_obj[key] = document.getElementById("show-" + key).checked;
          } catch (error) {
            console.log(key);
          }
          break;
      }
    });

    localStorage.setItem("settings", JSON.stringify(settings_obj));

    // Navigate to new tab with a pending notification
    localStorage.setItem("pendingNotification", "Settings Saved!");
    chrome.tabs.update({ url: "chrome://newtab" });
  });

  const navLinks = document.querySelectorAll(".options-sidebar nav a");
  const panels = document.querySelectorAll(".options-panel");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);

      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      link.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });

  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  });

  document
    .getElementById("background-image-input")
    .addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          settings.backgroundImage = event.target.result;
          localStorage.setItem("settings", JSON.stringify(settings));
          bgPreview.src = event.target.result;
          imagePresentContainer.classList.remove("hidden");
          bgPreview.classList.remove("hidden");
          bgAddLabel.classList.add("hidden");
          clearBgButton.classList.remove("hidden");
          showNotification(
            "Background image saved. It will appear on the new tab page.",
            3000,
            "success",
            false,
          );
        };
        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("clear-background-image")
    .addEventListener("click", () => {
      settings.backgroundImage = "";
      localStorage.setItem("settings", JSON.stringify(settings));
      document.getElementById("background-image-input").value = ""; // Clear file input
      bgPreview.src = "#";
      imagePresentContainer.classList.add("hidden");
      bgPreview.classList.add("hidden");
      bgAddLabel.classList.remove("hidden");
      clearBgButton.classList.add("hidden");
      showNotification("Background image cleared.", 2000, "restore", false);
    });
});

document.getElementById("restore-defaults").addEventListener("click", () => {
  localStorage.removeItem("settings");
  localStorage.setItem("settings", JSON.stringify(defaultSettings));

  // Navigate to new tab with a pending notification
  localStorage.setItem("pendingNotification", "Settings restored to defaults!");
  chrome.tabs.update({ url: "chrome://newtab" });
});



document.getElementById("show-topRight").onchange = (e) => {
  document
    .querySelector("#shortcuts-links")
    .classList.toggle("disabled", !e.target.checked);
};

let theme = localStorage.getItem("theme") || "system";

function applyTheme(theme) {
  document.body.classList.remove("dark", "light");
  switch (theme) {
    case "dark":
      document.body.classList.add("dark");
      break;
    case "light":
      document.body.classList.add("light");
      break;
    default:
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.add("light");
      }
      break;
  }
}

applyTheme(theme);

// Update About icons based on theme (light/dark/system)
function updateAboutIcons() {
  const webstoreImg = document.getElementById("webstore-img");
  const githubImg = document.getElementById("github-img");
  if (!webstoreImg || !githubImg) return;

  let effective = theme;
  if (theme === "system") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  webstoreImg.src = `favicons/chromewebstore-${effective}.png`;
  githubImg.src = `favicons/github-${effective}.png`;
}
updateAboutIcons();

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (theme === "system") {
      applyTheme("system");
    }
  });

// Keep About icons in sync when system theme changes while in 'system' mode
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (theme === "system") {
      try {
        updateAboutIcons();
      } catch (err) {
        /* ignore */
      }
    }
  });


// Export settings to JSON file
document.getElementById("export-settings").addEventListener("click", () => {
  const storedSettings = JSON.parse(localStorage.getItem("settings") || "{}");
  // Merge with defaults to ensure all keys are included in export
  const settings = { ...defaultSettings, ...storedSettings };
  const dataStr = JSON.stringify(settings, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "minimal-newtab-settings.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Settings exported successfully!", 2000, "success");
});

// Import settings from JSON file
document.getElementById("import-settings").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

function handleImportFile(file) {
  if (!file) return;

  // Check file type
  if (file.type !== "application/json" && !file.name.endsWith(".json")) {
    showNotification(
      "Invalid file type. Please use a .json file.",
      3000,
      "error",
    );
    return;
  }

  // Check file size (max 1MB)
  if (file.size > 1024 * 1024) {
    showNotification("File too large. Maximum size is 1MB.", 3000, "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      let importedSettings;
      try {
        importedSettings = JSON.parse(event.target.result);
      } catch (parseError) {
        showNotification(
          "Invalid JSON format. File may be corrupted.",
          3000,
          "error",
        );
        return;
      }

      // Validate that it's an object
      if (
        typeof importedSettings !== "object" ||
        importedSettings === null ||
        Array.isArray(importedSettings)
      ) {
        showNotification(
          "Invalid settings format. Expected a settings object.",
          3000,
          "error",
        );
        return;
      }

      // Check if it looks like a settings file (has at least one known key)
      const knownKeys = [
        "clock",
        "bookmarks",
        "theme",
        "topRight",
        "pixelArt",
        "sidebar",
      ];
      const hasKnownKey = knownKeys.some((key) =>
        importedSettings.hasOwnProperty(key),
      );
      if (!hasKnownKey) {
        showNotification(
          "This doesn't appear to be a valid settings file.",
          3000,
          "error",
        );
        return;
      }

      // Merge with default settings to ensure all keys exist
      const mergedSettings = { ...defaultSettings, ...importedSettings };

      localStorage.setItem("settings", JSON.stringify(mergedSettings));
      showNotification(
        "Settings imported successfully! Reloading...",
        2000,
        "success",
        true,
      );
    } catch (error) {
      console.error("Error importing settings:", error);
      showNotification(
        "Error importing settings. Please try again.",
        3000,
        "error",
      );
    }
  };
  reader.onerror = () => {
    showNotification("Error reading file. Please try again.", 3000, "error");
  };
  reader.readAsText(file);
}

document.getElementById("import-file").addEventListener("change", (e) => {
  handleImportFile(e.target.files[0]);
  // Reset the input so the same file can be selected again
  e.target.value = "";
});

// Drag and drop support for import button and drop zone
const importButton = document.getElementById("import-settings");
const dropZone = document.getElementById("import-drop-zone");
const dropTargets = [importButton, dropZone];

dropTargets.forEach((target) => {
  target.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("drag-over");
    importButton.classList.add("drag-over");
  });

  target.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("drag-over");
    importButton.classList.remove("drag-over");
  });

  target.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("drag-over");
    importButton.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    handleImportFile(file);
  });
});
