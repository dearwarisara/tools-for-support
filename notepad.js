(() => {
  const storageKey = "support-toolkit-notes";
  const grid = document.querySelector("#note-items");
  const empty = document.querySelector("#note-empty");
  const addButton = document.querySelector("#add-note");
  const undoButton = document.querySelector("#undo-note");
  const status = document.querySelector("#note-status");
  const hint = document.querySelector("#notepad-hint");
  const colors = [
    { id: "yellow", name: "เหลือง" },
    { id: "green", name: "เขียว" },
    { id: "pink", name: "ชมพู" },
    { id: "purple", name: "ม่วง" },
    { id: "blue", name: "ฟ้า" },
    { id: "gray", name: "เทา" },
    { id: "charcoal", name: "เทาเข้ม" },
  ];
  const defaultNotes = [{
    id: "preview-link",
    title: "ลูกค้าที่ต้องการ preview link",
    body: "PTTEP > Private Link ทุกกรณีที่ทำได้\nBTS > Private Link ข่าวทุกครั้ง\nJorakay > Private Popup ทุกครั้ง",
    color: "yellow",
  }];
  let deletedNote = null;
  let notes = defaultNotes;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved)) {
      const ids = new Set();
      notes = saved.filter((note) => {
        if (!note || typeof note.id !== "string" || ids.has(note.id)
          || typeof note.title !== "string" || typeof note.body !== "string") return false;
        ids.add(note.id);
        return true;
      }).map((note) => ({
        id: note.id,
        title: note.id === "preview-link" && note.title === "เจ้าที่ต้องการ preview link"
          ? defaultNotes[0].title : note.title,
        body: note.id === "preview-link" && note.body === "PTTEP > Private Link ทุกกรณีที่ทำได้\nBTS > Private Link ข่าวทุกครั้ง\nจระเข้ > Private Popup ทุกครั้ง"
          ? defaultNotes[0].body : note.body,
        color: colors.some((color) => color.id === note.color) ? note.color : "yellow",
      }));
    }
  } catch {
    // Start with the team note if storage is unavailable or invalid.
  }

  const saveNotes = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch {
      hint.textContent = "เบราว์เซอร์นี้บันทึกไม่ได้ โน้ตที่แก้ไขจะอยู่เฉพาะระหว่างเปิดหน้านี้";
    }
  };

  const fitBody = (field) => {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  };

  const renderNotes = () => {
    grid.replaceChildren();
    notes.forEach((note, index) => {
      const card = document.createElement("article");
      card.className = "note-card";
      card.dataset.noteId = note.id;
      card.dataset.color = note.color;

      const toolbar = document.createElement("div");
      toolbar.className = "note-toolbar";
      const palette = document.createElement("div");
      palette.className = "note-palette";
      palette.setAttribute("role", "group");
      palette.setAttribute("aria-label", `สีโน้ต ${index + 1}`);
      colors.forEach((color) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-color";
        button.dataset.noteColor = color.id;
        button.title = `สี${color.name}`;
        button.setAttribute("aria-label", `สี${color.name}`);
        button.setAttribute("aria-pressed", String(note.color === color.id));
        palette.append(button);
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-note-button";
      remove.dataset.deleteNote = "";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `ลบโน้ต ${index + 1}`);
      toolbar.append(palette, remove);

      const title = document.createElement("input");
      title.type = "text";
      title.className = "note-title";
      title.dataset.noteField = "title";
      title.maxLength = 120;
      title.value = note.title;
      title.placeholder = "หัวข้อโน้ต";
      title.setAttribute("aria-label", `หัวข้อโน้ต ${index + 1}`);
      const body = document.createElement("textarea");
      body.className = "note-body";
      body.dataset.noteField = "body";
      body.rows = 4;
      body.maxLength = 10000;
      body.value = note.body;
      body.placeholder = "จดข้อความที่อยากจำไว้ที่นี่...";
      body.setAttribute("aria-label", `ข้อความโน้ต ${index + 1}`);
      card.append(toolbar, title, body);
      grid.append(card);
      fitBody(body);
    });
    empty.hidden = notes.length > 0;
  };

  grid.addEventListener("input", (event) => {
    const field = event.target.dataset.noteField;
    if (!["title", "body"].includes(field)) return;
    const note = notes.find((item) => item.id === event.target.closest(".note-card").dataset.noteId);
    if (!note) return;
    note[field] = event.target.value;
    if (field === "body") fitBody(event.target);
    saveNotes();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const card = button.closest(".note-card");
    const index = notes.findIndex((note) => note.id === card.dataset.noteId);
    if (index < 0) return;
    if (button.dataset.noteColor) {
      notes[index].color = button.dataset.noteColor;
      card.dataset.color = button.dataset.noteColor;
      card.querySelectorAll(".note-color").forEach((swatch) => {
        swatch.setAttribute("aria-pressed", String(swatch === button));
      });
    } else if (button.hasAttribute("data-delete-note")) {
      deletedNote = { note: notes[index], index };
      notes.splice(index, 1);
      renderNotes();
      status.textContent = "ลบโน้ตแล้ว";
      undoButton.hidden = false;
      undoButton.focus();
    }
    saveNotes();
  });

  addButton.addEventListener("click", () => {
    notes.push({
      id: crypto.randomUUID(),
      title: "",
      body: "",
      color: colors[notes.length % colors.length].id,
    });
    saveNotes();
    renderNotes();
    grid.lastElementChild.querySelector(".note-title").focus();
    status.textContent = "เพิ่มโน้ตแล้ว";
  });

  undoButton.addEventListener("click", () => {
    if (!deletedNote) return;
    const { note, index } = deletedNote;
    notes.splice(index, 0, note);
    deletedNote = null;
    saveNotes();
    renderNotes();
    undoButton.hidden = true;
    status.textContent = "คืนค่าโน้ตแล้ว";
    grid.children[index].querySelector(".note-title").focus();
  });

  const fitAllBodies = () => grid.querySelectorAll(".note-body").forEach(fitBody);
  window.addEventListener("resize", fitAllBodies);
  document.fonts.ready.then(fitAllBodies);
  saveNotes();
  renderNotes();
})();
