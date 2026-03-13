const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".topnav a");
const quickTabs = document.querySelectorAll(".quick-tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const quickSearchInput = document.querySelector("#quick-search");
const languageSelect = document.querySelector("#language-select");
const languageDropdown = document.querySelector("[data-language-dropdown]");
const feishuLoginButton = document.querySelector(".feishu-login-button");

const panelRouteMap = {
  "brand-center": "brand-center",
  assets: "brand-center",
  "material-center": "material-center",
  search: "material-center",
  "design-center": "design-center",
  production: "design-center",
  "distribution-center": "distribution-center",
  integration: "distribution-center"
};

const FEISHU_NAME_QUERY_KEYS = ["feishu_name", "feishuName", "name", "user_name", "username"];
const feishuLoginUrl = feishuLoginButton?.dataset.loginUrl || "/api/auth/feishu/login";
const feishuLoginText = feishuLoginButton?.dataset.loginText || "登录";
const feishuPendingText = feishuLoginButton?.dataset.pendingText || "跳转授权中...";
const feishuCurrentUserLabel = feishuLoginButton?.dataset.currentUserLabel || "当前用户：";
const feishuUserStorageKey = feishuLoginButton?.dataset.userStorageKey || "fjd-feishu-user-name";

const setActiveLink = () => {
  const offset = window.scrollY + 140;
  let currentId = "";

  sections.forEach((section) => {
    if (offset >= section.offsetTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("active", isActive);
  });
};

const activatePanel = (targetId) => {
  quickTabs.forEach((item) => {
    const isActive = item.dataset.target === targetId;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });

  if (quickSearchInput) {
    const tab = [...quickTabs].find((item) => item.dataset.target === targetId);
    const placeholder = tab?.dataset.placeholder;
    if (placeholder) {
      quickSearchInput.placeholder = placeholder;
    }
  }
};

const syncPanelWithHash = () => {
  const hash = window.location.hash.replace("#", "");
  const targetPanel = panelRouteMap[hash];

  if (targetPanel) {
    activatePanel(targetPanel);
  }
};

const normalizeFeishuName = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const getStoredFeishuName = () => {
  try {
    return normalizeFeishuName(window.localStorage.getItem(feishuUserStorageKey) || "");
  } catch {
    return "";
  }
};

const storeFeishuName = (value) => {
  try {
    if (value) {
      window.localStorage.setItem(feishuUserStorageKey, value);
    }
  } catch {
    // Ignore storage exceptions and keep the UI usable.
  }
};

const getFeishuNameFromUrl = () => {
  const params = new URLSearchParams(window.location.search);

  for (const key of FEISHU_NAME_QUERY_KEYS) {
    const value = normalizeFeishuName(params.get(key) || "");
    if (value) {
      return value;
    }
  }

  return "";
};

const clearFeishuAuthParams = () => {
  const url = new URL(window.location.href);
  let hasChanges = false;

  [...FEISHU_NAME_QUERY_KEYS, "code", "state"].forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
};

const renderFeishuUser = (name) => {
  if (!feishuLoginButton) {
    return;
  }

  if (name) {
    feishuLoginButton.classList.remove("pending");
    feishuLoginButton.classList.add("logged-in");
    feishuLoginButton.disabled = true;
    feishuLoginButton.textContent = name;
    feishuLoginButton.setAttribute("aria-label", `${feishuCurrentUserLabel}${name}`);
    feishuLoginButton.title = name;
    return;
  }

  feishuLoginButton.classList.remove("pending", "logged-in");
  feishuLoginButton.disabled = false;
  feishuLoginButton.textContent = feishuLoginText;
  feishuLoginButton.setAttribute("aria-label", feishuLoginText);
  feishuLoginButton.removeAttribute("title");
};

const initializeFeishuUser = () => {
  const urlName = getFeishuNameFromUrl();
  const storedName = getStoredFeishuName();
  const feishuName = urlName || storedName;

  if (urlName) {
    storeFeishuName(urlName);
    clearFeishuAuthParams();
  }

  renderFeishuUser(feishuName);
};

const initializeLanguageDropdown = () => {
  if (!languageDropdown || !languageSelect) {
    return;
  }

  const trigger = languageDropdown.querySelector("[data-language-trigger]");
  const triggerText = languageDropdown.querySelector("[data-language-trigger-text]");
  const menuWrap = languageDropdown.querySelector("[data-language-menu-wrap]");
  const options = Array.from(languageDropdown.querySelectorAll("[data-language-option]"));
  const routeMap = {
    cn: "./index.html",
    en: "./index-en.html",
    ja: "./index-ja.html"
  };

  let isOpen = false;

  const syncSelected = (value) => {
    const nextValue = routeMap[value] ? value : "cn";
    languageSelect.value = nextValue;
    options.forEach((option) => {
      const isSelected = option.dataset.value === nextValue;
      option.classList.toggle("active", isSelected);
      option.setAttribute("aria-selected", isSelected ? "true" : "false");
      option.tabIndex = isSelected ? 0 : -1;
      if (isSelected && triggerText) {
        triggerText.textContent = option.textContent.trim();
      }
    });
  };

  const focusSelected = () => {
    const selectedOption = options.find((option) => option.dataset.value === languageSelect.value) || options[0];
    selectedOption?.focus();
  };

  const closeMenu = (focusTrigger = false) => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    languageDropdown.classList.remove("is-open");
    trigger?.setAttribute("aria-expanded", "false");
    if (menuWrap) {
      menuWrap.hidden = true;
    }
    if (focusTrigger) {
      trigger?.focus();
    }
  };

  const openMenu = () => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    languageDropdown.classList.add("is-open");
    trigger?.setAttribute("aria-expanded", "true");
    if (menuWrap) {
      menuWrap.hidden = false;
    }
    requestAnimationFrame(focusSelected);
  };

  const commitSelection = (value) => {
    syncSelected(value);
    languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
    closeMenu(true);
  };

  syncSelected(languageSelect.value);

  trigger?.addEventListener("click", () => {
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  });

  trigger?.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  });

  options.forEach((option, index) => {
    option.addEventListener("click", () => {
      commitSelection(option.dataset.value || "cn");
    });

    option.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        options[(index + 1) % options.length]?.focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        options[(index - 1 + options.length) % options.length]?.focus();
      }
      if (event.key === "Home") {
        event.preventDefault();
        options[0]?.focus();
      }
      if (event.key === "End") {
        event.preventDefault();
        options[options.length - 1]?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
      if (event.key === "Tab") {
        closeMenu();
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        commitSelection(option.dataset.value || "cn");
      }
    });
  });

  languageDropdown.addEventListener("focusout", (event) => {
    if (!languageDropdown.contains(event.relatedTarget)) {
      closeMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!languageDropdown.contains(event.target)) {
      closeMenu();
    }
  });

  languageSelect.addEventListener("change", () => {
    syncSelected(languageSelect.value);
    const nextUrl = routeMap[languageSelect.value] || routeMap.cn;
    window.location.assign(nextUrl);
  });
};

quickTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.target;
    activatePanel(targetId);

    const panel = document.getElementById(targetId);
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

if (feishuLoginButton) {
  feishuLoginButton.addEventListener("click", () => {
    if (feishuLoginButton.disabled) {
      return;
    }

    feishuLoginButton.classList.add("pending");
    feishuLoginButton.textContent = feishuPendingText;
    window.location.assign(feishuLoginUrl);
  });
}

initializeFeishuUser();
initializeLanguageDropdown();
syncPanelWithHash();
if (!panelRouteMap[window.location.hash.replace("#", "")]) {
  activatePanel("design-center");
}
setActiveLink();
window.addEventListener("scroll", setActiveLink);
window.addEventListener("hashchange", syncPanelWithHash);



