import { showNotification } from "./widgets/notification.js";

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hours}:${mins}`;
}

function analyzeAndSetTextColor(imageUrl) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const x = Math.floor(img.width / 4);
    const y = Math.floor(img.height / 4);
    const width = Math.floor(img.width / 2);
    const height = Math.floor(img.height / 2);
    const imageData = ctx.getImageData(x, y, width, height).data;

    let r = 0,
      g = 0,
      b = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
    }
    const pixelCount = imageData.length / 4;
    const luminance =
      0.299 * (r / pixelCount) +
      0.587 * (g / pixelCount) +
      0.114 * (b / pixelCount);
    document.body.style.color = luminance > 128 ? "#222" : "#f0f0f0";
  };
}

function applyTheme(theme) {

  document.body.classList.remove("dark", "light", "system");

  if (theme === "system") {
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? document.body.classList.add("dark")
      : document.body.classList.add("light");
  }
  document.body.classList.add(theme);

  const iconContainer = document.querySelector(".theme-icon");
  iconContainer
    ? iconContainer.innerHTML = icons[theme]
    : console.warn("Theme icon container not found");

  const label = document.querySelector(".theme-label");
  label
    ? label.textContent = theme[0].toUpperCase() + theme.slice(1)
    : console.warn("Theme label container not found");

  const customizeContainer = document.querySelector(".customize-icon");
  switch (theme) {
    case "system":
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? customizeContainer.innerHTML = customizeIcon["dark"]
        : customizeContainer.innerHTML = customizeIcon["light"];
      break;
    case "dark":
      customizeContainer.innerHTML = customizeIcon["dark"];
      break;
    case "light":
      customizeContainer.innerHTML = customizeIcon["light"];
      break;
    default:
      customizeContainer.innerHTML = customizeIcon[theme];
      break;
  }
}

function renderBookmarks(nodes, container, level = 0, path = "") {
  nodes.forEach((node) => {
    const currentPath = `${path}/${node.title || "Untitled"}`;

    if (node.children && node.children.length > 0) {
      const listItem = document.createElement("li");
      // Use w-full to ensure the hover backgrounds span the container
      listItem.className = "group mb-1 list-none";

      const folderButton = document.createElement("button");
      folderButton.type = "button";
      // Updated: Better padding, rounded corners, and a subtle text-opacity for hierarchy
      folderButton.className = "flex items-center gap-2 w-full px-2 py-1.5 text-sm font-semibold text-left transition-all rounded-md cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 active:scale-[0.98] select-none";

      const chevron = document.createElement("span");
      // Use a fixed width for the chevron to keep titles aligned
      chevron.className = "flex items-center justify-center w-4 h-4 text-[10px] transition-transform duration-200 opacity-60";
      chevron.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

      const title = document.createElement("span");
      title.textContent = node.title || "Untitled Folder";
      title.className = "truncate";

      folderButton.appendChild(chevron);
      folderButton.appendChild(title);

      const childrenList = document.createElement("ul");
      // Added: A subtle left border to visually indicate nesting depth
      childrenList.className = "mt-0.5 ml-4 border-l border-white/10 pl-2 space-y-0.5";

      // Folder State Logic
      const isOpen = localStorage.getItem(currentPath) === "true";
      if (isOpen) {
        chevron.classList.add("rotate-90");
      } else {
        childrenList.classList.add("hidden");
      }

      folderButton.addEventListener("click", () => {
        const isCollapsed = childrenList.classList.contains("hidden");
        if (isCollapsed) {
          childrenList.classList.remove("hidden");
          chevron.classList.add("rotate-90");
          localStorage.setItem(currentPath, "true");
        } else {
          childrenList.classList.add("hidden");
          chevron.classList.remove("rotate-90");
          localStorage.setItem(currentPath, "false");
        }
      });

      listItem.appendChild(folderButton);
      listItem.appendChild(childrenList);
      container.appendChild(listItem);

      renderBookmarks(node.children, childrenList, level + 1, currentPath);
    } else if (node.url) {
      const listItem = document.createElement("li");
      listItem.className = "list-none";

      const a = document.createElement("a");
      a.href = node.url;
      // Updated: Cleaned up the underline and added a soft hover pill effect
      a.className = "block px-2 py-1 text-sm no-underline transition-all rounded-md opacity-80 hover:opacity-100 hover:bg-white/10 dark:hover:bg-white/5 truncate max-w-full";

      // Optional: Add a small favicon-like dot or icon placeholder
      const linkText = document.createElement("span");
      linkText.textContent = node.title || node.url;

      a.appendChild(linkText);
      listItem.appendChild(a);
      container.appendChild(listItem);
    }
  });
}
if (localStorage.getItem("settings") === null) {
  localStorage.setItem("settings", JSON.stringify(defaultSettings));
}

const settings =
  JSON.parse(localStorage.getItem("settings")) || defaultSettings;

// Apply custom CSS if provided
if (settings.customCSS) {
  const styleElement = document.createElement("style");
  styleElement.id = "user-custom-css";
  styleElement.textContent = settings.customCSS;
  document.head.appendChild(styleElement);
}

if (settings.backgroundImage) {
  document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
  analyzeAndSetTextColor(settings.backgroundImage);

  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
}

if (settings.clock) {
  setInterval(updateClock, 1000);
  updateClock();
} else {
  document.getElementById("clock").style.display = "none";
}

if (settings.bookmarks) {
  chrome.bookmarks.getTree((tree) => {
    const shortcuts = document.getElementById("shortcuts");
    let bookmarksBar = settings.bookmarkFolder?.trim()
      ? tree[0].children.find(
        (f) =>
          f.title.toLowerCase() === settings.bookmarkFolder.toLowerCase(),
      )
      : tree[0].children[0];

    if (settings.bookmarkFolder?.trim() && !bookmarksBar) {
      shortcuts.textContent = "Bookmark folder not found.";
      return;
    }

    const listRoot = document.createElement("ul");
    listRoot.className = "bookmark-list";
    shortcuts.innerHTML = "";

    renderBookmarks(
      settings.bookmarkFolder?.trim()
        ? bookmarksBar.children
        : tree[0].children,
      listRoot,
    );

    shortcuts.appendChild(listRoot);
  });
} else {
  document.getElementById("shortcuts").style.display = "none";
}

if (settings.topRight) {
  const topRightOrder = settings.topRightOrder;
  let container = document.getElementById("top-right");
  container.innerHTML = "";
  topRightOrder.map((item) => {
    if (item.displayBool) {
      let itemElem = document.createElement("span");
      // class: text-[13px] p-2 cursor-pointer transition-colors duration-200 hover:text-[#c3c3c3]
      itemElem.id = "open-" + item["id"];
      itemElem.className = "cursor-pointer transition-colors duration-200 hover:text-[#c3c3c3]";
      itemElem.innerHTML = item["id"];
      itemElem.addEventListener("click", () => {
        chrome.tabs.create({ url: item["url"] });
      });
      container.append(itemElem);
    }
  });
} else {
  document.getElementById("top-right").style.display = "none";
}

const icons = {
  system: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"> <defs> <linearGradient id="half"> <stop offset="50%" stop-color="white" /> <stop offset="50%" stop-color="black" /> </linearGradient> </defs> <circle cx="24" cy="24" r="10" fill="url(#half)" stroke="currentColor" stroke-width="2"/> <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" stroke-width="2"/> <line x1="24" y1="38" x2="24" y2="46" stroke="currentColor" stroke-width="2"/> <line x1="2" y1="24" x2="10" y2="24" stroke="currentColor" stroke-width="2"/> <line x1="38" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="2"/> <line x1="8.5" y1="8.5" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="2"/> <line x1="33.5" y1="33.5" x2="39.5" y2="39.5" stroke="currentColor" stroke-width="2"/> <line x1="8.5" y1="39.5" x2="14.5" y2="33.5" stroke="currentColor" stroke-width="2"/> <line x1="33.5" y1="14.5" x2="39.5" y2="8.5" stroke="currentColor" stroke-width="2"/> </svg>`,
  dark: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"> <path fill="none" stroke="white" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/> </svg>`,
  light: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="black" stroke-width="2"> <circle cx="24" cy="24" r="10" fill="none"/> <line x1="24" y1="2" x2="24" y2="10"/> <line x1="24" y1="38" x2="24" y2="46"/> <line x1="2" y1="24" x2="10" y2="24"/> <line x1="38" y1="24" x2="46" y2="24"/> <line x1="8.5" y1="8.5" x2="14.5" y2="14.5"/> <line x1="33.5" y1="33.5" x2="39.5" y2="39.5"/> <line x1="8.5" y1="39.5" x2="14.5" y2="33.5"/> <line x1="33.5" y1="14.5" x2="39.5" y2="8.5"/> </svg>`,
};

const customizeIcon = {
  dark: `<svg fill="white" width="32px" height="32px" viewBox="-1 0 44 44"><path id="_45.Settings" data-name="45.Settings" d="M35,22H13A10,10,0,0,1,13,2H35a10,10,0,0,1,0,20ZM35,4H13a8,8,0,0,0,0,16H35A8,8,0,0,0,35,4ZM13,18a6,6,0,1,1,6-6A6,6,0,0,1,13,18ZM13,8a4,4,0,1,0,4,4A4,4,0,0,0,13,8Zm0,18H35a10,10,0,0,1,0,20H13a10,10,0,0,1,0-20Zm0,18H35a8,8,0,0,0,0-16H13a8,8,0,0,0,0,16ZM35,30a6,6,0,1,1-6,6A6,6,0,0,1,35,30Zm0,10a4,4,0,1,0-4-4A4,4,0,0,0,35,40Z" transform="translate(-3 -2)" fill-rule="evenodd"/></svg>`,
  light: `<svg fill="black" width="32px" height="32px" viewBox="-1 0 44 44"><path id="_45.Settings" data-name="45.Settings" d="M35,22H13A10,10,0,0,1,13,2H35a10,10,0,0,1,0,20ZM35,4H13a8,8,0,0,0,0,16H35A8,8,0,0,0,35,4ZM13,18a6,6,0,1,1,6-6A6,6,0,0,1,13,18ZM13,8a4,4,0,1,0,4,4A4,4,0,0,0,13,8Zm0,18H35a10,10,0,0,1,0,20H13a10,10,0,0,1,0-20Zm0,18H35a8,8,0,0,0,0-16H13a8,8,0,0,0,0,16ZM35,30a6,6,0,1,1-6,6A6,6,0,0,1,35,30Zm0,10a4,4,0,1,0-4-4A4,4,0,0,0,35,40Z" transform="translate(-3 -2)" fill-rule="evenodd"/></svg>`,
};

document.getElementById("customize").addEventListener("click", () => {
  location.href = "/options.html";
});

// Initialize theme
let theme = localStorage.getItem("theme") || "system";
applyTheme(theme);

// Handle toggle click
const toogleOrder = ["system", "dark", "light"];
document.querySelector(".theme-toggle").addEventListener("click", () => {
  theme = toogleOrder[(toogleOrder.indexOf(theme) + 1) % toogleOrder.length];
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});

// React to system theme change if in system mode
if (theme === "system") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => applyTheme("system"));
}

// On page initialization, check for pending notification
const pendingNotification = localStorage.getItem("pendingNotification");
if (pendingNotification) {
  showNotification(pendingNotification, 2000, "success", false);
  localStorage.removeItem("pendingNotification");
}
