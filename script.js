(() => {
  const usageKey = "support-toolkit-usage";
  const cards = [...document.querySelectorAll(".tool-card[data-tool-id]")];
  const searchInput = document.querySelector("#tool-search");
  const searchResult = document.querySelector("#search-result");
  const toolCount = document.querySelector("#tool-count");
  const toolGrid = document.querySelector(".tool-grid");
  const frequentList = document.querySelector("#frequent-tools-list");
  const frequentEmpty = document.querySelector("#frequent-empty");
  const clearUsage = document.querySelector("#clear-usage");
  let memoryUsage = {};

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

  const getCardData = (card) => ({
    id: card.dataset.toolId,
    name: card.querySelector("h3")?.textContent.trim() || "เครื่องมือ",
    href: card.querySelector(".tool-link")?.href || "#",
  });

  const renderFrequentTools = () => {
    const usage = readUsage();
    const frequentTools = cards
      .map((card) => ({ ...getCardData(card), ...usage[card.dataset.toolId] }))
      .filter((tool) => Number(tool.count) > 0)
      .sort((a, b) => Number(b.count) - Number(a.count) || Number(b.lastUsed) - Number(a.lastUsed))
      .slice(0, 3);

    frequentList.innerHTML = frequentTools
      .map(
        (tool, index) => `
          <a class="frequent-item" href="${tool.href}" target="_blank" rel="noopener noreferrer" data-tool-id="${tool.id}">
            <span class="frequent-rank">0${index + 1}</span>
            <span class="frequent-copy">
              <span class="frequent-name">${tool.name}</span>
              <span class="frequent-count">ใช้ ${tool.count} ครั้ง</span>
            </span>
            <span class="frequent-arrow" aria-hidden="true">↗</span>
          </a>
        `,
      )
      .join("");

    frequentEmpty.classList.toggle("is-hidden", frequentTools.length > 0);
  };

  const recordUsage = (toolId) => {
    const usage = readUsage();
    const current = usage[toolId] || { count: 0, lastUsed: 0 };
    usage[toolId] = { count: Number(current.count) + 1, lastUsed: Date.now() };
    saveUsage(usage);
    renderFrequentTools();
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

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.tool-link, a.frequent-item");
    const toolId = link?.dataset.toolId || link?.closest(".tool-card")?.dataset.toolId;
    if (toolId) recordUsage(toolId);
  });

  searchInput.addEventListener("input", filterTools);
  clearUsage.addEventListener("click", () => {
    saveUsage({});
    renderFrequentTools();
  });

  renderFrequentTools();
  filterTools();
})();
