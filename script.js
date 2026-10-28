(() => {
  const usageKey = "support-toolkit-usage";
  const customToolsKey = "support-toolkit-custom-tools";
  const searchInput = document.querySelector("#tool-search");
  const searchResult = document.querySelector("#search-result");
  const toolCount = document.querySelector("#tool-count");
  const toolGrid = document.querySelector(".tool-grid");
  const recentList = document.querySelector("#recent-items");
  const recentEmpty = document.querySelector("#recent-empty");
  const documentLinks = [...document.querySelectorAll(".document-card[data-document-id]")];
  const openedAtFormat = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const clearUsage = document.querySelector("#clear-usage");
  const addToolPanel = document.querySelector("#add-tool-panel");
  const openAddTool = document.querySelector("#open-add-tool");
  const closeAddTool = document.querySelector("#close-add-tool");
  const cancelAddTool = document.querySelector("#cancel-add-tool");
  const addToolForm = document.querySelector("#add-tool-form");
  const addToolError = document.querySelector("#add-tool-error");
  const nameInput = document.querySelector("#tool-name");
  const urlInput = document.querySelector("#tool-url");
  const categoryInput = document.querySelector("#tool-category");
  const descriptionInput = document.querySelector("#tool-description");
  let cards = [...document.querySelectorAll(".tool-card[data-tool-id]")];
  let memoryUsage = {};
  let memoryCustomTools = [];

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

  const readUsage = () => {
    try {
      const storedUsage = JSON.parse(localStorage.getItem(usageKey) || "{}");
      return Object.keys(storedUsage).length > 0 ? storedUsage : memoryUsage;
    } catch {
      return memoryUsage;
    }
  };

  const saveUsage = (usage) => {
    memoryUsage = usage;
    try {
      localStorage.setItem(usageKey, JSON.stringify(usage));
    } catch {
      // The site still works when browser storage is unavailable.
    }
  };

  const readCustomTools = () => {
    try {
      const storedTools = JSON.parse(localStorage.getItem(customToolsKey) || "[]");
      return Array.isArray(storedTools) ? storedTools : memoryCustomTools;
    } catch {
      return memoryCustomTools;
    }
  };

  const saveCustomTools = (tools) => {
    memoryCustomTools = tools;
    try {
      localStorage.setItem(customToolsKey, JSON.stringify(tools));
    } catch {
      // The site still works when browser storage is unavailable.
    }
  };

  const isSafeHttpUrl = (value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const refreshCards = () => {
    cards = [...document.querySelectorAll(".tool-card[data-tool-id]")];
  };

  const getCardData = (card) => ({
    id: card.dataset.toolId,
    name: card.querySelector("h3")?.textContent.trim() || "เครื่องมือ",
    href: card.querySelector(".tool-link")?.href || "#",
    kind: "เครื่องมือ",
  });

  const createCustomCard = (tool) => `
    <article class="tool-card tool-card-custom" data-tool-id="${escapeHTML(tool.id)}">
      <div class="card-topline">
        <span class="tool-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" role="img">
            <path d="M12 16h24v20H12z" />
            <path d="M18 16v-4h12v4M18 23h12M18 29h8" />
          </svg>
        </span>
        <span class="tool-tag">${escapeHTML(tool.category)}</span>
      </div>
      <div class="card-content">
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.description)}</p>
      </div>
      <a class="tool-link" href="${escapeHTML(tool.url)}" target="_blank" rel="noopener noreferrer">
        <span>เปิดใช้งาน</span><span class="arrow" aria-hidden="true">↗</span>
      </a>
    </article>
  `;

  const renderRecentItems = () => {
    const usage = readUsage();
    const documents = documentLinks.map((link) => ({
      id: link.dataset.documentId,
      name: link.querySelector("strong")?.textContent.trim() || "เอกสาร",
      href: link.href,
      kind: "เอกสาร",
    }));
    const recentItems = [...cards.map(getCardData), ...documents]
      .map((item) => ({ ...item, lastUsed: Number(usage[item.id]?.lastUsed) || 0 }))
      .filter((item) => item.lastUsed > 0 && !Number.isNaN(new Date(item.lastUsed).getTime()))
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 3);

    recentList.innerHTML = recentItems
      .map(
        (item, index) => `
          <a class="frequent-item" href="${escapeHTML(item.href)}" target="_blank" rel="noopener noreferrer" data-item-id="${escapeHTML(item.id)}">
            <span class="frequent-rank">0${index + 1}</span>
            <span class="frequent-copy">
              <span class="frequent-name">${escapeHTML(item.name)}</span>
              <span class="frequent-count">${item.kind} • ${escapeHTML(openedAtFormat.format(item.lastUsed))}</span>
            </span>
            <span class="frequent-arrow" aria-hidden="true">↗</span>
          </a>
        `,
      )
      .join("");

    recentEmpty.classList.toggle("is-hidden", recentItems.length > 0);
  };

  const recordUsage = (itemId) => {
    const usage = readUsage();
    const current = usage[itemId] || { count: 0, lastUsed: 0 };
    usage[itemId] = { count: Number(current.count) + 1, lastUsed: Date.now() };
    saveUsage(usage);
    renderRecentItems();
  };

  const filterTools = () => {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const searchableText = card.textContent.toLowerCase();
      const isMatch = !query || searchableText.includes(query);
      card.classList.toggle("is-hidden", !isMatch);
      if (isMatch) visibleCount += 1;
    });

    toolGrid.querySelector(".search-empty")?.remove();
    if (visibleCount === 0) {
      toolGrid.insertAdjacentHTML("beforeend", '<p class="search-empty">ไม่พบเครื่องมือที่ค้นหา ลองใช้คำอื่นดูนะ</p>');
    }

    toolCount.textContent = `${visibleCount} / ${cards.length} tools`;
    searchResult.textContent = `พบ ${visibleCount} เครื่องมือ`;
  };

  const closeForm = () => {
    addToolPanel.hidden = true;
    addToolForm.reset();
    addToolError.textContent = "";
  };

  readCustomTools().forEach((tool) => {
    if (tool.id && tool.name && isSafeHttpUrl(tool.url)) {
      toolGrid.insertAdjacentHTML("beforeend", createCustomCard({
        id: tool.id,
        name: tool.name,
        url: tool.url,
        category: tool.category || "ทั่วไป",
        description: tool.description || "เครื่องมือที่เพิ่มโดยคุณ",
      }));
    }
  });
  refreshCards();

  const recordOpenedLink = (event) => {
    if (event.type === "auxclick" && event.button !== 1) return;
    const link = event.target.closest("a.tool-link, a.document-card, a.frequent-item");
    const itemId = link?.dataset.itemId
      || link?.dataset.documentId
      || link?.closest(".tool-card")?.dataset.toolId;
    if (itemId) recordUsage(itemId);
  };
  document.addEventListener("click", recordOpenedLink);
  document.addEventListener("auxclick", recordOpenedLink);

  openAddTool?.addEventListener("click", () => {
    addToolPanel.hidden = false;
    nameInput.focus();
  });
  closeAddTool.addEventListener("click", closeForm);
  cancelAddTool.addEventListener("click", closeForm);
  searchInput.addEventListener("input", filterTools);
  clearUsage.addEventListener("click", () => {
    saveUsage({});
    renderRecentItems();
  });

  addToolForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addToolError.textContent = "";

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const category = categoryInput.value.trim() || "ทั่วไป";
    const description = descriptionInput.value.trim() || "เครื่องมือที่เพิ่มโดยคุณ";

    if (!name || !url) {
      addToolError.textContent = "กรุณากรอกชื่อเครื่องมือและลิงก์ให้ครบถ้วน";
      return;
    }
    if (!isSafeHttpUrl(url)) {
      addToolError.textContent = "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://";
      return;
    }
    if (cards.some((card) => card.querySelector(".tool-link")?.href === url)) {
      addToolError.textContent = "มีเครื่องมือนี้อยู่ในรายการแล้ว";
      return;
    }

    const tool = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      url,
      category,
      description,
    };
    saveCustomTools([tool, ...readCustomTools()]);
    toolGrid.insertAdjacentHTML("beforeend", createCustomCard(tool));
    refreshCards();
    closeForm();
    filterTools();
    renderRecentItems();
  });

  renderRecentItems();
  filterTools();
})();
