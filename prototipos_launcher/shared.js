const games = [
  {
    name: "Cyberpunk 2077",
    category: "Juegos",
    type: "Steam",
    status: "Listo",
    recent: 1,
    favorite: true,
    path: "steam://rungameid/1091500",
    cover: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Forza Horizon",
    category: "Juegos",
    type: "Xbox",
    status: "Listo",
    recent: 2,
    favorite: true,
    path: "C:\\Games\\Forza\\ForzaHorizon.exe",
    cover: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Valorant",
    category: "Juegos",
    type: "Riot",
    status: "Actualizar",
    recent: 7,
    favorite: false,
    path: "C:\\Riot Games\\VALORANT\\live\\VALORANT.exe",
    cover: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Minecraft",
    category: "Juegos",
    type: "Launcher",
    status: "Listo",
    recent: 4,
    favorite: false,
    path: "C:\\XboxGames\\Minecraft Launcher\\Minecraft.exe",
    cover: "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Discord",
    category: "Programas",
    type: "Chat",
    status: "Listo",
    recent: 3,
    favorite: true,
    path: "C:\\Users\\Jonathan\\AppData\\Local\\Discord\\Update.exe",
    cover: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "OBS Studio",
    category: "Herramientas",
    type: "Grabación",
    status: "Listo",
    recent: 8,
    favorite: false,
    path: "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
    cover: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Photoshop",
    category: "Programas",
    type: "Diseño",
    status: "Listo",
    recent: 5,
    favorite: false,
    path: "C:\\Program Files\\Adobe\\Photoshop\\Photoshop.exe",
    cover: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Steam",
    category: "Programas",
    type: "Tienda",
    status: "Online",
    recent: 6,
    favorite: true,
    path: "C:\\Program Files (x86)\\Steam\\steam.exe",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "VS Code",
    category: "Herramientas",
    type: "Código",
    status: "Listo",
    recent: 9,
    favorite: false,
    path: "C:\\Users\\Jonathan\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    cover: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Diablo IV",
    category: "Juegos",
    type: "Battle.net",
    status: "Temporada activa",
    recent: 10,
    favorite: true,
    path: "C:\\Program Files (x86)\\Diablo IV\\Diablo IV Launcher.exe",
    cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "World of Warcraft",
    category: "Juegos",
    type: "Battle.net",
    status: "2 amigos online",
    recent: 11,
    favorite: false,
    path: "C:\\Program Files (x86)\\World of Warcraft\\World of Warcraft Launcher.exe",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "The Witcher 3",
    category: "Juegos",
    type: "GOG",
    status: "Sin DRM",
    recent: 12,
    favorite: false,
    path: "C:\\GOG Games\\The Witcher 3 Wild Hunt\\witcher3.exe",
    cover: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Cyberpunk REDmod",
    category: "Herramientas",
    type: "GOG",
    status: "Complemento",
    recent: 13,
    favorite: false,
    path: "C:\\GOG Galaxy\\Games\\Cyberpunk 2077\\tools\\redmod.exe",
    cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80"
  }
];

let state = {
  filter: "all",
  platform: "all",
  query: "",
  sort: document.body.dataset.template === "list" ? "name" : "recent",
  accentIndex: 0
};

const accents = [
  ["#54d6bd", "#82a6ff"],
  ["#f6c85f", "#fd7d6b"],
  ["#a7f06a", "#56c2ff"],
  ["#ff79a8", "#8ea7ff"]
];

const library = document.querySelector("#library");
const search = document.querySelector("#search");
const toast = document.querySelector("#toast");
const details = document.querySelector("#details");

function platformOf(item) {
  if (["Steam", "GOG", "Battle.net", "Xbox", "Riot"].includes(item.type)) return item.type;
  if (item.name === "Steam") return "Steam";
  return "Windows";
}

function filteredItems() {
  let items = [...games];
  if (state.filter === "favorite") items = items.filter(item => item.favorite);
  if (!["all", "favorite"].includes(state.filter)) items = items.filter(item => item.category === state.filter);
  if (state.platform !== "all") items = items.filter(item => platformOf(item) === state.platform);
  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      platformOf(item).toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q)
    );
  }
  items.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name);
    if (state.sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    if (state.sort === "platform") return platformOf(a).localeCompare(platformOf(b)) || a.name.localeCompare(b.name);
    if (state.sort === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
    return a.recent - b.recent;
  });
  return items;
}

function render() {
  const template = document.body.dataset.template;
  const items = filteredItems();
  if (!items.length) {
    library.innerHTML = `<div class="empty">No hay resultados con ese filtro.</div>`;
    return;
  }
  library.innerHTML = items.map((item, index) => {
    if (template === "command") return quickRow(item, index);
    if (template === "list") return tableRow(item, index);
    return gameCard(item, index);
  }).join("");
}

function gameCard(item, index) {
  return `
    <article class="game-card" data-index="${index}">
      <img class="cover" src="${item.cover}" alt="Portada de ${item.name}">
      <div class="card-body">
        <h2>${item.name}</h2>
        <div class="meta"><span>${item.category} · ${item.type}</span><strong class="badge">${item.status}</strong></div>
        <div class="card-actions">
          <button class="primary" data-open="${item.name}">Abrir</button>
          <button class="fav ${item.favorite ? "on" : ""}" data-fav="${item.name}" aria-label="Favorito">${item.favorite ? "★" : "☆"}</button>
        </div>
      </div>
    </article>
  `;
}

function quickRow(item) {
  return `
    <article class="quick-row">
      <img src="${item.cover}" alt="Portada de ${item.name}">
      <button class="plain" data-detail="${item.name}">
        <strong>${item.name}</strong>
        <span>${item.category} · ${item.status}</span>
      </button>
      <span class="platform-badge">${platformOf(item)}</span>
      <button class="secondary" data-open="${item.name}">Abrir</button>
    </article>
  `;
}

function tableRow(item) {
  return `
    <article class="table-row">
      <img src="${item.cover}" alt="Portada de ${item.name}">
      <button class="plain" data-detail="${item.name}">
        <strong>${item.name}</strong>
        <span>${item.path}</span>
      </button>
      <span class="type">${item.type}</span>
      <span class="status">${item.status}</span>
      <span class="path">${item.category}</span>
      <button class="secondary" data-open="${item.name}">Abrir</button>
    </article>
  `;
}

function showDetails(item) {
  details.innerHTML = `
    <img class="modal-cover" src="${item.cover}" alt="Portada de ${item.name}">
    <div class="modal-body">
      <div>
        <h2>${item.name}</h2>
        <p>${item.category} · ${platformOf(item)} · ${item.status}</p>
      </div>
      <p>${item.path}</p>
      <div class="modal-actions">
        <button class="secondary" data-close>Cerrar</button>
        <button class="primary" data-open="${item.name}">Abrir</button>
      </div>
    </div>
  `;
  details.showModal();
}

function openItem(name) {
  const item = games.find(entry => entry.name === name) || games[0];
  showToast(`Abriendo ${item.name}...`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function setActiveButton(selector, target) {
  document.querySelectorAll(selector).forEach(button => button.classList.toggle("active", button === target));
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-filter]");
  if (nav) {
    state.filter = nav.dataset.filter;
    state.platform = "all";
    setActiveButton("[data-filter]", nav);
    document.querySelectorAll("[data-platform-filter]").forEach(button => button.classList.remove("active"));
    render();
  }

  const sort = event.target.closest("[data-sort]");
  if (sort) {
    state.sort = sort.dataset.sort;
    setActiveButton("[data-sort]", sort);
    render();
  }

  const shortcut = event.target.closest("[data-filter-shortcut]");
  if (shortcut) {
    state.filter = shortcut.dataset.filterShortcut;
    state.platform = "all";
    document.querySelectorAll("[data-filter]").forEach(button => button.classList.toggle("active", button.dataset.filter === state.filter));
    document.querySelectorAll("[data-platform-filter]").forEach(button => button.classList.remove("active"));
    render();
  }

  const platform = event.target.closest("[data-platform-filter]");
  if (platform) {
    state.platform = platform.dataset.platformFilter;
    state.filter = "all";
    document.querySelectorAll("[data-filter]").forEach(button => button.classList.toggle("active", button.dataset.filter === "all"));
    document.querySelectorAll("[data-platform-filter]").forEach(button => button.classList.toggle("active", button === platform));
    render();
    showToast(`Mostrando ${state.platform}`);
  }

  const open = event.target.closest("[data-open]");
  if (open) openItem(open.dataset.open);

  const fav = event.target.closest("[data-fav]");
  if (fav) {
    const item = games.find(entry => entry.name === fav.dataset.fav);
    item.favorite = !item.favorite;
    render();
    showToast(item.favorite ? `${item.name} agregado a favoritos` : `${item.name} quitado de favoritos`);
  }

  const card = event.target.closest(".game-card");
  if (card && !event.target.closest("button")) {
    showDetails(filteredItems()[Number(card.dataset.index)]);
  }

  const detail = event.target.closest("[data-detail]");
  if (detail) showDetails(games.find(entry => entry.name === detail.dataset.detail));

  if (event.target.closest("[data-close]")) details.close();

  if (event.target.closest("[data-random]")) {
    const items = filteredItems();
    const item = items[Math.floor(Math.random() * items.length)] || games[0];
    openItem(item.name);
  }

  if (event.target.closest("[data-accent]")) {
    state.accentIndex = (state.accentIndex + 1) % accents.length;
    document.documentElement.style.setProperty("--accent", accents[state.accentIndex][0]);
    document.documentElement.style.setProperty("--accent-2", accents[state.accentIndex][1]);
    showToast("Acento visual cambiado");
  }

  if (event.target.closest("[data-density]")) {
    document.body.classList.toggle("compact-mode");
    showToast(document.body.classList.contains("compact-mode") ? "Modo compacto activo" : "Modo cómodo activo");
  }

  if (event.target.closest("[data-open-featured]")) openItem("Cyberpunk 2077");
});

search?.addEventListener("input", event => {
  state.query = event.target.value.trim();
  render();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && details.open) details.close();
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search?.focus();
  }
});

render();
