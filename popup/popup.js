const input = document.getElementById("task");
const addBtn = document.getElementById("add");
const listEl = document.getElementById("list");

function render(tasks) {
  // sort list
  tasks.sort((a, b) => {
    return a.done - b.done;
  })

  listEl.innerHTML = "";

  tasks.forEach((t) => {
    const li = document.createElement("li");

    // --- Checkbox ---
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "check";
    checkbox.dataset.id = t.id;
    checkbox.checked = !!t.done;

    // Handler: update status selesai
    checkbox.addEventListener("change", (e) => {
      const id = e.target.dataset.id;

      chrome.storage.sync.get(["tasks"], (res) => {
        const tasks = res.tasks ?? [];
        const task = tasks.find((x) => x.id == id);
        if (!task) return;

        task.done = e.target.checked;
        chrome.storage.sync.set({ tasks }, () => render(tasks));
      })
    })

    // --- Text ---
    const span = document.createElement("span");
    span.dataset.id = t.id;
    span.textContent = t.text ?? t;

    // Kalau done, kasih garis coret
    if (t.done) {
      span.style.textDecoration = "line-through";
      span.style.color = "gray";
    }

    // Edit task
    span.ondblclick = (e) => {
      if (t.done) return;

      const id = e.target.dataset.id;

      chrome.storage.sync.get(["tasks"], (res) => {
        const tasks = res.tasks ?? [];
        const idx = tasks.findIndex((x) => x.id == id);
        if (idx === -1) return;

        enableEdit(span, idx);
      })
    }

    // --- Delete button ---
    const delBtn = document.createElement("button");
    delBtn.className = "del";
    delBtn.dataset.id = t.id;
    delBtn.innerHTML = `<img src="/images/bin.png" width=18 />`;

    // Handler: hapus item
    delBtn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;

      chrome.storage.sync.get(["tasks"], (res) => {
        let tasks = res.tasks ?? [];
        tasks = tasks.filter((x) => x.id !== id);

        chrome.storage.sync.set({ tasks }, () => render(tasks));
      })
    })

    // Append semua elemen ke li
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);

    // Render ke list
    listEl.appendChild(li);
  })
}

function enableEdit(span, index) {
  const oldText = span.textContent;

  // buat input baru
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldText;
  input.className = "edit-input";

  // ganti span dengan input
  span.replaceWith(input);

  // fokus & select teks
  input.focus();
  input.select();

  // ketika enter -> save
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(input.value.trim(), index, oldText);
    }
  })

  // ketika blur -> save
  input.addEventListener("blur", () => {
    saveEdit(input.value.trim(), index, oldText);
  })
}

function saveEdit(newText, index, oldText) {
  chrome.storage.sync.get(["tasks"], (res) => {
    const tasks = res.tasks ?? [];

    const task = tasks[index];
    if (!task) return;

    if (!newText) {
        task.text = oldText;
    } else {
        task.text = newText;
    }

    chrome.storage.sync.set({ tasks }, () => {
      render(tasks);
    })
  })
}

function save(tasks) {
  chrome.storage.sync.set({ tasks });
}

function load() {
  chrome.storage.sync.get(["tasks"], (res) => {
    render(res.tasks ?? []);
  })
}

function addTask() {
    const text = input.value.trim();
    if (!text) return;

    chrome.storage.sync.get(["tasks"], (res) => {
        const tasks = res.tasks ?? [];

        tasks.push({
            id: crypto.randomUUID(),
            text,
            done: false,
        })
        save(tasks);
        render(tasks);
        input.value = "";
    })
}

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        addTask();
    }
})

addBtn.onclick = () => {
    addTask();
}

load();
