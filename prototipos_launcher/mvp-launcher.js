const data = window.MVP_DATA;
const state = {
  view: "home",
  platform: "all",
  sort: "recent",
  query: "",
  layout: "grid",
  filters: {
    installed: true,
    favorites: false,
    updates: false,
    controller: false
  },
  featuredId: "game_valorant",
  paused: false,
  accentIndex: 0
};

const coverMap = {
  game_cyberpunk_2077: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80",
  game_baldurs_gate_3: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80",
  game_diablo_iv: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  game_forza_horizon_5: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  game_fortnite: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&w=1200&q=80",
  game_valorant: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  game_league_of_legends: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1200&q=80",
  game_hades_ii: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
  game_overwatch_2: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
  game_control_ultimate: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  app_minecraft_modded: "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80",
  app_emulation_station: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
};

const accents = [
  ["#57d7bf", "#7ea5ff"],
  ["#66c0f4", "#1b77c5"],
  ["#86328a", "#d06ee5"],
  ["#00aeef", "#2454ff"],
  ["#d13639", "#ff9f6e"]
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const byId = (collection, id) => collection.find((item) => item.id === id);
const platform = (id) => byId(data.platforms, id) || data.platforms.at(-1);
const game = (id) => byId(data.games, id);
const imageFor = (item) => coverMap[item.id] || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80";
const playStateLabel = {
  ready: "Listo",
  updating: "Actualizando",
  queued: "En cola",
  not_installed: "No instalado"
};

function init() {
  bindEvents();
  renderAll();
  openView("home");
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-btn]");
    if (viewButton) openView(viewButton.dataset.viewBtn);

    const play = event.target.closest("[data-play]");
    if (play) launchGame(play.dataset.play);

    if (event.target.closest("[data-play-featured]")) launchGame(state.featuredId);
    if (event.target.closest("[data-open-featured]")) openGameDialog(state.featuredId);

    const detail = event.target.closest("[data-detail]");
    if (detail) openGameDialog(detail.dataset.detail);

    const favorite = event.target.closest("[data-favorite]");
    if (favorite) toggleFavorite(favorite.dataset.favorite);

    const platformFilter = event.target.closest("[data-platform]");
    if (platformFilter) {
      state.platform = platformFilter.dataset.platform;
      renderLibrary();
      renderPlatformFilters();
    }

    const sort = event.target.closest("[data-sort]");
    if (sort) {
      state.sort = sort.dataset.sort;
      $$("#libraryView [data-sort]").forEach((button) => button.classList.toggle("active", button === sort));
      renderLibrary();
    }

    const layout = event.target.closest("[data-layout]");
    if (layout) {
      state.layout = layout.dataset.layout;
      $$("[data-layout]").forEach((button) => button.classList.toggle("active", button === layout));
      renderLibrary();
    }

    const toastButton = event.target.closest("[data-toast]");
    if (toastButton) showToast(toastButton.dataset.toast);

    if (event.target.closest("[data-big-picture]")) toggleBigPicture();
    if (event.target.closest("[data-command]")) openCommand();
    if (event.target.closest("[data-add-game]")) $("#addDialog").showModal();
    if (event.target.closest("[data-pause-all]")) togglePauseDownloads();
    if (event.target.closest("[data-accent-cycle]")) cycleAccent();

    const commandResult = event.target.closest("[data-command-action]");
    if (commandResult) runCommand(commandResult.dataset.commandAction, commandResult.dataset.target);
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-check-filter]");
    if (checkbox) {
      state.filters[checkbox.dataset.checkFilter] = checkbox.checked;
      renderLibrary();
    }
  });

  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderLibrary();
    if (state.view !== "library" && state.query) openView("library");
  });

  $("#commandInput").addEventListener("input", renderCommandResults);

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommand();
    }
    if (event.key === "Escape") closeTopDialog();
    if (event.key >= "1" && event.key <= "6" && !isTyping()) {
      const views = ["home", "library", "downloads", "social", "platforms", "settings"];
      openView(views[Number(event.key) - 1]);
    }
  });
}

function renderAll() {
  renderFeatured();
  renderRecentStrip();
  renderQuickActions();
  renderActivity();
  renderDownloads();
  renderPlatforms();
  renderNews();
  renderFriends();
  renderPlatformManager();
  renderPlatformFilters();
  renderLibrary();
}

function openView(view) {
  state.view = view;
  $(".app-shell").dataset.view = view;
  $$(".view").forEach((section) => section.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  $$("[data-view-btn]").forEach((button) => button.classList.toggle("active", button.dataset.viewBtn === view));
  $("#viewTitle").textContent = {
    home: "Centro de mando",
    library: "Biblioteca unificada",
    downloads: "Descargas",
    social: "Social y actividad",
    platforms: "Plataformas conectadas",
    settings: "Ajustes"
  }[view];
}

function renderFeatured() {
  const item = game(state.featuredId) || data.games[0];
  const source = platform(item.platformId);
  $("#featuredImage").src = imageFor(item);
  $("#featuredImage").alt = `Arte de ${item.title}`;
  $("#featuredPlatform").textContent = `${source.name} · ${playStateLabel[item.playState]}`;
  $("#featuredTitle").textContent = item.title;
  $("#featuredMeta").textContent = `${item.genre.join(" / ")} · ${item.playtimeHours.toFixed(1)} h jugadas · ${item.cloudSave.replace("_", " ")}`;
  $("#sessionTime").textContent = `${Math.max(1, Math.round(item.playtimeHours % 6))}h ${Math.round((item.playtimeHours % 1) * 60)}m`;
  $("#sessionText").textContent = item.favorite ? "Favorito y listo para jugar" : "Disponible desde tu biblioteca";
}

function renderRecentStrip() {
  const items = [...data.games]
    .filter((item) => item.installed)
    .sort((a, b) => new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0))
    .slice(0, 4);
  $("#recentStrip").innerHTML = items.map((item) => `
    <article class="poster-card">
      <img src="${imageFor(item)}" alt="Portada de ${item.title}">
      <button data-detail="${item.id}">
        <strong>${item.title}</strong>
        <span>${platform(item.platformId).name} · ${Math.round(item.playtimeHours)} h</span>
      </button>
    </article>
  `).join("");
}

function renderActivity() {
  $("#activityList").innerHTML = data.activity.slice(0, 5).map((entry) => {
    const item = game(entry.gameId);
    return `
      <article class="activity-item">
        <i></i>
        <div>
          <strong>${entry.title}</strong>
          <span>${item ? item.title : "Sistema"} · ${entry.detail}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderQuickActions() {
  $("#quickActions").innerHTML = data.quickActions.map((action) => {
    const item = action.gameId ? game(action.gameId) : null;
    const friend = action.friendId ? byId(data.friends, action.friendId) : null;
    const target = item ? item.id : action.action;
    return `
      <button class="quick-action" data-command-action="${item ? "play" : "quick"}" data-target="${target}">
        <strong>${action.label}</strong>
        <span>${item ? item.title : friend ? friend.displayName : "Sistema"}</span>
      </button>
    `;
  }).join("");
}

function renderNews() {
  $("#newsList").innerHTML = data.newsAndEvents.slice(0, 4).map((entry) => `
    <article class="news-card">
      <strong>${entry.title}</strong>
      <span>${platform(entry.platformId).name} · ${entry.summary}</span>
      <button class="soft-button full" data-toast="${entry.cta} simulado">${entry.cta}</button>
    </article>
  `).join("");
}

function renderDownloads() {
  const queue = data.downloads.map(downloadRow).join("");
  $("#downloadQueue").innerHTML = queue;
  $("#downloadMini").innerHTML = data.downloads.slice(0, 2).map(downloadRow).join("");
  const active = data.downloads.find((item) => item.status === "downloading");
  $("#speedText").textContent = active && !state.paused ? `${active.speedMbps.toFixed(0)} MB/s` : "0 MB/s";
}

function downloadRow(download) {
  const item = game(download.gameId);
  const source = platform(download.platformId);
  const status = state.paused && download.status === "downloading" ? "pausado" : download.status;
  return `
    <article class="download-item">
      <div>
        <strong>${item.title}</strong>
        <span>${source.name} · ${status} · ${download.downloadedGb}/${download.totalGb} GB</span>
        <div class="progress"><i style="width:${download.progress}%"></i></div>
        <span>${download.etaMinutes ? `${download.etaMinutes} min restantes` : "Sin espera"}</span>
      </div>
      <button class="secondary" data-toast="${download.status === "completed" ? "Ya está instalado" : "Acción de cola simulada"}">${download.status === "completed" ? "Listo" : "Gestionar"}</button>
    </article>
  `;
}

function renderPlatforms() {
  $("#platformStrip").innerHTML = data.platforms.slice(0, 5).map((item) => `
    <article class="platform-pill">
      <strong>${item.name}</strong>
      <span>${item.installedCount}/${item.libraryCount} instalados</span>
      <span>${item.connected ? "Conectada" : "Necesita login"}</span>
    </article>
  `).join("");
}

function renderPlatformManager() {
  $("#platformManager").innerHTML = data.platforms.map((item) => `
    <article class="platform-card" style="--accent:${item.accent}">
      <header>
        <div>
          <span class="platform-logo">${item.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <button class="soft-button" data-toast="${item.name} sincronizando">${item.connected ? "Sync" : "Conectar"}</button>
      </header>
      <div>
        <h2>${item.name}</h2>
        <span>${item.account}</span>
        <span>${item.libraryCount} juegos · ${item.installedCount} instalados</span>
      </div>
      <div class="progress"><i style="width:${Math.min(100, item.installedCount / item.libraryCount * 100)}%"></i></div>
    </article>
  `).join("");
}

function renderPlatformFilters() {
  const buttons = [{ id: "all", name: "Todas" }, ...data.platforms].map((item) => `
    <button class="${state.platform === item.id ? "active" : ""}" data-platform="${item.id}">${item.name}</button>
  `).join("");
  $("#platformFilters").innerHTML = buttons;
}

function renderLibrary() {
  const grid = $("#libraryGrid");
  grid.classList.toggle("list-mode", state.layout === "list");
  const items = filteredGames();
  grid.innerHTML = items.length ? items.map(gameCard).join("") : `<div class="panel"><h2>Sin resultados</h2><p>Cambia filtros o búsqueda.</p></div>`;
}

function filteredGames() {
  let items = [...data.games];
  if (state.platform !== "all") items = items.filter((item) => item.platformId === state.platform || item.sourceIds.includes(state.platform));
  if (state.filters.installed) items = items.filter((item) => item.installed);
  if (state.filters.favorites) items = items.filter((item) => item.favorite);
  if (state.filters.updates) items = items.filter((item) => item.playState === "updating" || item.playState === "queued");
  if (state.filters.controller) items = items.filter((item) => item.tags.includes("controller") || item.tags.includes("volante") || item.sourceIds.includes("xbox"));
  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.genre.join(" ").toLowerCase().includes(q) ||
      item.tags.join(" ").toLowerCase().includes(q) ||
      platform(item.platformId).name.toLowerCase().includes(q) ||
      item.playState.toLowerCase().includes(q)
    );
  }
  items.sort((a, b) => {
    if (state.sort === "name") return a.title.localeCompare(b.title);
    if (state.sort === "hours") return b.playtimeHours - a.playtimeHours;
    if (state.sort === "status") return a.playState.localeCompare(b.playState);
    return new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0);
  });
  return items;
}

function gameCard(item) {
  const source = platform(item.platformId);
  const cta = item.playState === "not_installed" ? "Instalar" : item.playState === "updating" ? "Actualizar" : "Jugar";
  return `
    <article class="game-card">
      <div class="game-art">
        <img src="${imageFor(item)}" alt="Portada de ${item.title}">
        <span class="platform-badge">${source.name}</span>
      </div>
      <div class="game-info">
        <h3>${item.title}</h3>
        <p>${item.genre.slice(0, 2).join(" / ")} · ${playStateLabel[item.playState]}</p>
        <p>${Math.round(item.playtimeHours)} h · ${item.sizeGb} GB · ${item.sourceIds.length > 1 ? "Duplicado agrupado" : "Única fuente"}</p>
        <div class="game-actions">
          <button class="primary" data-play="${item.id}">${cta}</button>
          <button class="fav-button ${item.favorite ? "active" : ""}" data-favorite="${item.id}">${item.favorite ? "★" : "☆"}</button>
        </div>
        <button class="soft-button full" data-detail="${item.id}">Detalles</button>
      </div>
    </article>
  `;
}

function renderFriends() {
  $("#friendsGrid").innerHTML = data.friends.map((friend) => {
    const current = friend.currentGameId ? game(friend.currentGameId) : null;
    const statusClass = friend.status === "away" ? "away" : friend.status === "offline" ? "offline" : "";
    return `
      <article class="friend-card">
        <span class="friend-avatar">${friend.displayName[0]}</span>
        <div>
          <strong>${friend.displayName}</strong>
          <span>${current ? `Jugando ${current.title}` : "Sin actividad actual"} · ${platform(friend.platformId).name}</span>
        </div>
        <i class="status-dot ${statusClass}"></i>
      </article>
    `;
  }).join("");
}

function openGameDialog(id) {
  const item = game(id);
  if (!item) return;
  const source = platform(item.platformId);
  const achievements = data.achievements.filter((achievement) => achievement.gameId === id);
  const friends = data.friends.filter((friend) => friend.currentGameId === id || friend.mutualGames.includes(id));
  $("#gameDialog").innerHTML = `
    <section class="game-detail-hero">
      <img src="${imageFor(item)}" alt="Arte de ${item.title}">
      <div class="game-detail-content">
        <p class="eyebrow">${source.name} · ${playStateLabel[item.playState]}</p>
        <h2>${item.title}</h2>
        <p>${item.genre.join(" / ")} · ${item.tags.join(", ")}</p>
        <div class="featured-actions">
          <button class="primary" data-play="${item.id}">${item.installed ? "Jugar" : "Instalar"}</button>
          <button class="secondary" data-toast="Carpeta abierta en simulación">Abrir carpeta</button>
          <button class="secondary" data-toast="Opciones de lanzamiento abiertas">Launch options</button>
          <button class="secondary" onclick="document.querySelector('#gameDialog').close()">Cerrar</button>
        </div>
        <div class="stat-grid">
          <div class="mini-stat"><span>Horas</span><strong>${Math.round(item.playtimeHours)}</strong></div>
          <div class="mini-stat"><span>Tamaño</span><strong>${item.sizeGb} GB</strong></div>
          <div class="mini-stat"><span>Fuentes</span><strong>${item.sourceIds.map((sourceId) => platform(sourceId).name).join(" / ")}</strong></div>
        </div>
      </div>
    </section>
    <section class="detail-grid">
      <article class="panel">
        <h2>Logros</h2>
        ${achievements.length ? achievements.map((achievement) => `
          <div class="setting-row"><span>${achievement.name}</span><strong>${achievement.unlocked ? "Desbloqueado" : `${achievement.progress}%`}</strong></div>
        `).join("") : "<p>No hay logros sincronizados.</p>"}
      </article>
      <article class="panel">
        <h2>Social</h2>
        ${friends.length ? friends.slice(0, 3).map((friend) => `
          <div class="setting-row"><span>${friend.displayName}</span><strong>${friend.partyOpen ? "Party abierta" : friend.status}</strong></div>
        `).join("") : "<p>Nadie jugando ahora.</p>"}
      </article>
    </section>
  `;
  $("#gameDialog").showModal();
}

function toggleFavorite(id) {
  const item = game(id);
  item.favorite = !item.favorite;
  renderAll();
  showToast(item.favorite ? `${item.title} agregado a favoritos` : `${item.title} quitado de favoritos`);
}

function launchGame(id) {
  const item = game(id);
  if (!item) return;
  state.featuredId = id;
  renderFeatured();
  showToast(`${item.playState === "not_installed" ? "Instalando" : "Abriendo"} ${item.title}`);
}

function toggleBigPicture() {
  document.body.classList.toggle("big-picture");
  showToast(document.body.classList.contains("big-picture") ? "Modo TV activado" : "Modo escritorio activado");
}

function togglePauseDownloads() {
  state.paused = !state.paused;
  renderDownloads();
  showToast(state.paused ? "Descargas pausadas" : "Descargas reanudadas");
}

function cycleAccent() {
  state.accentIndex = (state.accentIndex + 1) % accents.length;
  document.documentElement.style.setProperty("--accent", accents[state.accentIndex][0]);
  document.documentElement.style.setProperty("--accent-2", accents[state.accentIndex][1]);
  showToast("Tema actualizado");
}

function openCommand() {
  $("#commandDialog").showModal();
  $("#commandInput").value = "";
  renderCommandResults();
  setTimeout(() => $("#commandInput").focus(), 0);
}

function renderCommandResults() {
  const query = $("#commandInput").value.trim().toLowerCase();
  const actions = [
    { label: "Ir a biblioteca", action: "view", target: "library" },
    { label: "Abrir descargas", action: "view", target: "downloads" },
    { label: "Gestionar plataformas", action: "view", target: "platforms" },
    { label: "Activar modo TV", action: "big", target: "" },
    ...data.games.map((item) => ({ label: `Jugar ${item.title}`, action: "play", target: item.id }))
  ].filter((item) => !query || item.label.toLowerCase().includes(query)).slice(0, 8);
  $("#commandResults").innerHTML = actions.map((item) => `
    <button class="command-result" data-command-action="${item.action}" data-target="${item.target}">
      <span>${item.label}</span><kbd>Enter</kbd>
    </button>
  `).join("");
}

function runCommand(action, target) {
  $("#commandDialog").close();
  if (action === "view") openView(target);
  if (action === "play") launchGame(target);
  if (action === "big") toggleBigPicture();
  if (action === "quick") showToast("Acción rápida ejecutada");
}

function closeTopDialog() {
  ["#gameDialog", "#commandDialog", "#addDialog"].forEach((selector) => {
    const dialog = $(selector);
    if (dialog.open) dialog.close();
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function isTyping() {
  return ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
}

init();
