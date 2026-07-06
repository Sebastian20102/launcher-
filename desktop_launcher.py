import json
import os
import re
import sys
from pathlib import Path

from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QAction, QColor, QFont, QKeySequence, QLinearGradient, QPainter, QPixmap
from PySide6.QtWidgets import (
    QApplication,
    QButtonGroup,
    QCheckBox,
    QComboBox,
    QDialog,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QProgressBar,
    QScrollArea,
    QSizePolicy,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)


ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "prototipos_launcher" / "mvp-data.js"


def load_mvp_data():
    text = DATA_FILE.read_text(encoding="utf-8")
    match = re.search(r"window\.MVP_DATA\s*=\s*(\{.*?\});\s*\}\)\(\);", text, re.S)
    if not match:
        raise RuntimeError("No pude leer window.MVP_DATA desde mvp-data.js")

    raw = match.group(1)
    raw = re.sub(r"(?m)^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', raw)
    return json.loads(raw)


def platform_for(data, platform_id):
    return next((item for item in data["platforms"] if item["id"] == platform_id), data["platforms"][-1])


def game_for(data, game_id):
    return next((item for item in data["games"] if item["id"] == game_id), None)


def make_cover(title, accent="#57d7bf", size=QSize(360, 220)):
    pixmap = QPixmap(size)
    pixmap.fill(QColor("#0b0f16"))
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)

    base = QColor(accent)
    bg = QLinearGradient(0, 0, size.width(), size.height())
    bg.setColorAt(0, QColor("#1a2230"))
    bg.setColorAt(0.45, QColor("#101620"))
    bg.setColorAt(1, QColor("#070a0f"))
    painter.fillRect(0, 0, size.width(), size.height(), bg)

    glow = QLinearGradient(0, 0, size.width(), size.height())
    glow.setColorAt(0, QColor(base.red(), base.green(), base.blue(), 170))
    glow.setColorAt(0.5, QColor(base.red(), base.green(), base.blue(), 55))
    glow.setColorAt(1, QColor(0, 0, 0, 0))
    painter.fillRect(0, 0, size.width(), size.height(), glow)

    painter.setBrush(base)
    painter.setPen(Qt.NoPen)
    painter.drawEllipse(-90, -80, 260, 260)
    painter.setBrush(QColor(base.red(), base.green(), base.blue(), 85))
    painter.drawEllipse(size.width() - 180, size.height() - 150, 300, 300)

    painter.setPen(QColor(255, 255, 255, 28))
    for offset in range(-size.height(), size.width(), 42):
        painter.drawLine(offset, size.height(), offset + size.height(), 0)

    shade = QLinearGradient(0, 0, 0, size.height())
    shade.setColorAt(0, QColor(0, 0, 0, 0))
    shade.setColorAt(0.55, QColor(0, 0, 0, 80))
    shade.setColorAt(1, QColor(0, 0, 0, 220))
    painter.fillRect(0, 0, size.width(), size.height(), shade)

    painter.setPen(QColor("#f4f7fb"))
    font = QFont("Segoe UI", max(18, size.width() // 17), QFont.Bold)
    painter.setFont(font)
    rect = pixmap.rect().adjusted(24, size.height() // 2, -24, -24)
    painter.drawText(rect, Qt.AlignLeft | Qt.AlignBottom | Qt.TextWordWrap, title)
    painter.end()
    return pixmap


class Card(QFrame):
    def __init__(self, title=None):
        super().__init__()
        self.setObjectName("card")
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(18, 18, 18, 18)
        self.layout.setSpacing(12)
        if title:
            label = QLabel(title)
            label.setObjectName("sectionTitle")
            self.layout.addWidget(label)


class GameCard(QFrame):
    def __init__(self, data, game, on_play, on_detail, on_fav):
        super().__init__()
        self.data = data
        self.game = game
        self.setObjectName("gameCard")
        self.setMinimumHeight(380)

        source = platform_for(data, game["platformId"])
        state = {
            "ready": "Listo",
            "updating": "Actualizar",
            "queued": "En cola",
            "not_installed": "Instalar",
        }.get(game["playState"], game["playState"])

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 14)
        layout.setSpacing(10)

        cover = QLabel()
        cover.setPixmap(make_cover(game["title"], source.get("accent", "#57d7bf")))
        cover.setScaledContents(True)
        cover.setMinimumHeight(190)
        cover.setMaximumHeight(190)
        layout.addWidget(cover)

        body = QVBoxLayout()
        body.setContentsMargins(16, 0, 16, 0)
        title = QLabel(game["title"])
        title.setObjectName("gameTitle")
        title.setWordWrap(True)
        meta = QLabel(f'{source["name"]} · {state} · {round(game["playtimeHours"])} h')
        meta.setObjectName("muted")
        meta.setWordWrap(True)
        body.addWidget(title)
        body.addWidget(meta)

        actions = QHBoxLayout()
        play = QPushButton("Jugar" if game["installed"] else "Instalar")
        play.setObjectName("primaryButton")
        play.clicked.connect(lambda: on_play(game["id"]))
        detail = QPushButton("Detalles")
        detail.clicked.connect(lambda: on_detail(game["id"]))
        fav = QPushButton("★" if game["favorite"] else "+")
        fav.setObjectName("favButton")
        fav.clicked.connect(lambda: on_fav(game["id"]))
        actions.addWidget(play)
        actions.addWidget(detail)
        actions.addWidget(fav)
        body.addLayout(actions)
        layout.addLayout(body)


class DetailDialog(QDialog):
    def __init__(self, parent, data, game):
        super().__init__(parent)
        self.setWindowTitle(game["title"])
        self.setMinimumSize(780, 560)
        self.setObjectName("detailDialog")
        source = platform_for(data, game["platformId"])
        achievements = [item for item in data["achievements"] if item["gameId"] == game["id"]]
        friends = [item for item in data["friends"] if game["id"] in item["mutualGames"] or item["currentGameId"] == game["id"]]

        root = QVBoxLayout(self)
        root.setContentsMargins(18, 18, 18, 18)
        root.setSpacing(14)

        hero = QFrame()
        hero.setObjectName("detailHero")
        hero_layout = QHBoxLayout(hero)
        cover = QLabel()
        cover.setPixmap(make_cover(game["title"], source.get("accent", "#57d7bf"), QSize(360, 260)))
        cover.setScaledContents(True)
        cover.setFixedSize(320, 220)
        hero_layout.addWidget(cover)

        info = QVBoxLayout()
        eyebrow = QLabel(f'{source["name"]} · {game["playState"]}')
        eyebrow.setObjectName("eyebrow")
        title = QLabel(game["title"])
        title.setObjectName("heroTitle")
        title.setWordWrap(True)
        meta = QLabel(f'{", ".join(game["genre"])}\n{game.get("installPath", "No instalado")}')
        meta.setObjectName("muted")
        meta.setWordWrap(True)
        info.addWidget(eyebrow)
        info.addWidget(title)
        info.addWidget(meta)
        stats = QLabel(f'{game["sizeGb"]} GB · {round(game["playtimeHours"])} h jugadas · fuentes: {", ".join(game["sourceIds"])}')
        stats.setObjectName("muted")
        info.addWidget(stats)
        buttons = QHBoxLayout()
        buttons.addWidget(QPushButton("Jugar" if game["installed"] else "Instalar"))
        buttons.addWidget(QPushButton("Abrir carpeta"))
        buttons.addWidget(QPushButton("Launch options"))
        info.addLayout(buttons)
        hero_layout.addLayout(info, 1)
        root.addWidget(hero)

        lower = QHBoxLayout()
        ach_card = Card("Logros")
        if achievements:
            for item in achievements:
                ach_card.layout.addWidget(QLabel(f'{item["name"]} · {"OK" if item.get("unlocked") else str(item.get("progress", 0)) + "%"}'))
        else:
            ach_card.layout.addWidget(QLabel("Sin logros sincronizados."))
        lower.addWidget(ach_card)

        social_card = Card("Social")
        if friends:
            for item in friends[:4]:
                social_card.layout.addWidget(QLabel(f'{item["displayName"]} · {item["status"]}'))
        else:
            social_card.layout.addWidget(QLabel("Nadie jugando ahora."))
        lower.addWidget(social_card)
        root.addLayout(lower)


class DesktopLauncher(QMainWindow):
    def __init__(self):
        super().__init__()
        self.data = load_mvp_data()
        self.current_view = "Inicio"
        self.platform_filter = "all"
        self.sort_mode = "Recientes"
        self.query = ""
        self.only_installed = True
        self.only_favorites = False
        self.only_updates = False
        self.big_picture = False
        self.setWindowTitle("Nexus Launcher Desktop")
        self.resize(1480, 900)
        self.setup_ui()
        self.apply_style()
        self.render_all()

    def setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QHBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(286)
        side_layout = QVBoxLayout(sidebar)
        side_layout.setContentsMargins(20, 20, 20, 20)
        side_layout.setSpacing(12)

        brand = QLabel("NX\nNexus Launcher")
        brand.setObjectName("brand")
        side_layout.addWidget(brand)

        self.nav = QListWidget()
        self.nav.setObjectName("nav")
        for name in ["Inicio", "Biblioteca", "Descargas", "Social", "Plataformas", "Ajustes"]:
            QListWidgetItem(name, self.nav)
        self.nav.setCurrentRow(0)
        self.nav.currentTextChanged.connect(self.open_view)
        side_layout.addWidget(self.nav, 1)

        side_panel = QFrame()
        side_panel.setObjectName("sidePanel")
        side_panel_layout = QVBoxLayout(side_panel)
        side_panel_layout.setContentsMargins(14, 14, 14, 14)
        side_panel_layout.addWidget(QLabel("Sistema"))
        side_panel_layout.addWidget(QLabel("7 plataformas conectadas"))
        side_panel_layout.addWidget(QLabel("33 juegos instalados"))
        side_layout.addWidget(side_panel)

        tv = QPushButton("Modo TV")
        tv.clicked.connect(self.toggle_big_picture)
        side_layout.addWidget(tv)
        command = QPushButton("Comando rápido  Ctrl+K")
        command.clicked.connect(self.open_command)
        side_layout.addWidget(command)
        root.addWidget(sidebar)

        main = QWidget()
        main_layout = QVBoxLayout(main)
        main_layout.setContentsMargins(28, 22, 28, 26)
        main_layout.setSpacing(18)

        top = QHBoxLayout()
        self.title_label = QLabel("Centro de mando")
        self.title_label.setObjectName("pageTitle")
        top.addWidget(self.title_label)
        top.addStretch()
        self.search = QLineEdit()
        self.search.setPlaceholderText("Buscar juego, plataforma, amigo, estado")
        self.search.textChanged.connect(self.on_search)
        self.search.setFixedWidth(500)
        top.addWidget(self.search)
        add = QPushButton("+")
        add.setFixedWidth(48)
        add.clicked.connect(self.add_game_dialog)
        top.addWidget(add)
        main_layout.addLayout(top)

        self.stack = QStackedWidget()
        self.pages = {
            "Inicio": self.home_page(),
            "Biblioteca": self.library_page(),
            "Descargas": self.downloads_page(),
            "Social": self.social_page(),
            "Plataformas": self.platforms_page(),
            "Ajustes": self.settings_page(),
        }
        for page in self.pages.values():
            self.stack.addWidget(page)
        main_layout.addWidget(self.stack, 1)
        root.addWidget(main, 1)

        command_action = QAction(self)
        command_action.setShortcut(QKeySequence("Ctrl+K"))
        command_action.triggered.connect(self.open_command)
        self.addAction(command_action)

    def home_page(self):
        page, _inner, layout = self.scroll_page()
        self.featured = Card()
        self.featured.setObjectName("featured")
        layout.addWidget(self.featured)

        grid = QGridLayout()
        self.recent_card = Card("Biblioteca reciente")
        self.activity_card = Card("Actividad")
        self.download_card = Card("Descargas")
        self.platform_card = Card("Plataformas")
        self.news_card = Card("Noticias")
        self.quick_card = Card("Acciones rápidas")
        grid.setSpacing(16)
        grid.addWidget(self.recent_card, 0, 0, 1, 2)
        grid.addWidget(self.quick_card, 0, 2)
        grid.addWidget(self.activity_card, 1, 0)
        grid.addWidget(self.download_card, 1, 1)
        grid.addWidget(self.platform_card, 1, 2)
        grid.addWidget(self.news_card, 2, 0, 1, 3)
        layout.addLayout(grid)
        return page

    def library_page(self):
        outer = QWidget()
        layout = QVBoxLayout(outer)
        filters = QHBoxLayout()
        self.platform_combo = QComboBox()
        self.platform_combo.addItem("Todas", "all")
        for item in self.data["platforms"]:
            self.platform_combo.addItem(item["name"], item["id"])
        self.platform_combo.currentIndexChanged.connect(self.on_platform_filter)
        filters.addWidget(self.platform_combo)

        self.sort_combo = QComboBox()
        self.sort_combo.addItems(["Recientes", "A-Z", "Horas", "Estado"])
        self.sort_combo.currentTextChanged.connect(self.on_sort)
        filters.addWidget(self.sort_combo)

        self.installed_check = QCheckBox("Instalados")
        self.installed_check.setChecked(True)
        self.installed_check.stateChanged.connect(self.on_filter_checks)
        self.fav_check = QCheckBox("Favoritos")
        self.fav_check.stateChanged.connect(self.on_filter_checks)
        self.update_check = QCheckBox("Updates")
        self.update_check.stateChanged.connect(self.on_filter_checks)
        filters.addWidget(self.installed_check)
        filters.addWidget(self.fav_check)
        filters.addWidget(self.update_check)
        filters.addStretch()
        layout.addLayout(filters)

        self.library_scroll = QScrollArea()
        self.library_scroll.setWidgetResizable(True)
        self.library_container = QWidget()
        self.library_grid = QGridLayout(self.library_container)
        self.library_grid.setSpacing(14)
        self.library_scroll.setWidget(self.library_container)
        layout.addWidget(self.library_scroll, 1)
        return outer

    def downloads_page(self):
        page, _inner, layout = self.scroll_page()
        self.downloads_card = Card("Cola de descargas y actualizaciones")
        layout.addWidget(self.downloads_card)
        network = Card("Red")
        network.layout.addWidget(QLabel("86 MB/s · límite 90 MB/s · D:\\Games"))
        pause = QPushButton("Pausar todo")
        pause.clicked.connect(lambda: self.toast("Descargas pausadas/reanudadas"))
        network.layout.addWidget(pause)
        layout.addWidget(network)
        return page

    def social_page(self):
        page, _inner, layout = self.scroll_page()
        self.friends_card = Card("Amigos y actividad")
        layout.addWidget(self.friends_card)
        invites = Card("Invitaciones")
        invites.layout.addWidget(QLabel("Warzone Squad · invitación pendiente"))
        invites.layout.addWidget(QPushButton("Aceptar"))
        layout.addWidget(invites)
        return page

    def platforms_page(self):
        page, _inner, layout = self.scroll_page()
        self.platforms_grid = QGridLayout()
        layout.addLayout(self.platforms_grid)
        return page

    def settings_page(self):
        page, _inner, layout = self.scroll_page()
        for title, rows in {
            "Escaneo local": ["Steam", "Escritorio", "Menú Inicio"],
            "Experiencia": ["Iniciar en modo TV", "Animaciones", "Mostrar amigos"],
            "Rutas": ["C:\\Program Files (x86)\\Steam", "D:\\Games", "C:\\Program Files (x86)\\Battle.net"],
        }.items():
            card = Card(title)
            for row in rows:
                check = QCheckBox(row)
                check.setChecked(True)
                card.layout.addWidget(check)
            layout.addWidget(card)
        return page

    def scroll_page(self):
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        inner = QWidget()
        layout = QVBoxLayout(inner)
        layout.setSpacing(16)
        layout.setContentsMargins(0, 0, 0, 0)
        scroll.setWidget(inner)
        return scroll, inner, layout

    def render_all(self):
        self.render_featured()
        self.render_home_cards()
        self.render_library()
        self.render_downloads()
        self.render_social()
        self.render_platforms()

    def clear_layout(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            child_layout = item.layout()
            if widget:
                widget.deleteLater()
            elif child_layout:
                self.clear_layout(child_layout)

    def render_featured(self):
        self.clear_layout(self.featured.layout)
        item = game_for(self.data, "game_valorant") or self.data["games"][0]
        source = platform_for(self.data, item["platformId"])
        row = QHBoxLayout()
        row.setSpacing(24)
        art = QLabel()
        art.setObjectName("heroArt")
        art.setPixmap(make_cover(item["title"], source.get("accent", "#57d7bf"), QSize(640, 360)))
        art.setScaledContents(True)
        art.setFixedSize(540, 304)
        row.addWidget(art)
        info = QVBoxLayout()
        info.setSpacing(12)
        eyebrow = QLabel(f'{source["name"]} · continuar jugando')
        eyebrow.setObjectName("eyebrow")
        title = QLabel(item["title"])
        title.setObjectName("heroTitle")
        title.setWordWrap(True)
        meta = QLabel(f'{", ".join(item["genre"])} · {round(item["playtimeHours"])} h · {item["cloudSave"]}')
        meta.setObjectName("muted")
        meta.setWordWrap(True)
        stats = QLabel("ONLINE READY     CLOUD SYNC     CONTROLLER OK")
        stats.setObjectName("heroStats")
        play = QPushButton("Jugar ahora")
        play.setObjectName("primaryButton")
        play.clicked.connect(lambda: self.launch_game(item["id"]))
        detail = QPushButton("Ver detalles")
        detail.clicked.connect(lambda: self.open_detail(item["id"]))
        buttons = QHBoxLayout()
        buttons.addWidget(play)
        buttons.addWidget(detail)
        buttons.addStretch()
        info.addWidget(eyebrow)
        info.addWidget(title)
        info.addWidget(meta)
        info.addWidget(stats)
        info.addLayout(buttons)
        info.addStretch()
        row.addLayout(info, 1)
        self.featured.layout.addLayout(row)

    def render_home_cards(self):
        self.fill_card(self.recent_card, [
            (item["title"], f'{platform_for(self.data, item["platformId"])["name"]} · {round(item["playtimeHours"])} h')
            for item in sorted(self.data["games"], key=lambda g: g.get("lastPlayed", ""), reverse=True)[:5]
        ])
        self.fill_card(self.activity_card, [(item["title"], item["detail"]) for item in self.data["activity"][:5]])
        self.fill_card(self.quick_card, [(item["label"], item["action"]) for item in self.data["quickActions"]])
        self.fill_card(self.news_card, [(item["title"], item["summary"]) for item in self.data["newsAndEvents"][:4]])
        self.fill_card(self.platform_card, [
            (item["name"], f'{item["installedCount"]}/{item["libraryCount"]} instalados')
            for item in self.data["platforms"][:6]
        ])

    def fill_card(self, card, rows):
        title = card.layout.itemAt(0).widget().text()
        self.clear_layout(card.layout)
        label = QLabel(title)
        label.setObjectName("sectionTitle")
        card.layout.addWidget(label)
        for name, detail in rows:
            row = QLabel(f"<b>{name}</b><br><span style='color:#9aa8ba'>{detail}</span>")
            row.setWordWrap(True)
            row.setObjectName("rowLabel")
            row.setMinimumHeight(58)
            card.layout.addWidget(row)

    def render_library(self):
        self.clear_layout(self.library_grid)
        items = self.filtered_games()
        columns = 3 if not self.big_picture else 2
        for index, item in enumerate(items):
            card = GameCard(self.data, item, self.launch_game, self.open_detail, self.toggle_favorite)
            self.library_grid.addWidget(card, index // columns, index % columns)
        self.library_grid.setRowStretch((len(items) // columns) + 1, 1)

    def filtered_games(self):
        items = list(self.data["games"])
        if self.platform_filter != "all":
            items = [item for item in items if item["platformId"] == self.platform_filter or self.platform_filter in item["sourceIds"]]
        if self.only_installed:
            items = [item for item in items if item["installed"]]
        if self.only_favorites:
            items = [item for item in items if item["favorite"]]
        if self.only_updates:
            items = [item for item in items if item["playState"] in ("updating", "queued")]
        if self.query:
            q = self.query.lower()
            items = [
                item for item in items
                if q in item["title"].lower()
                or q in " ".join(item["genre"]).lower()
                or q in platform_for(self.data, item["platformId"])["name"].lower()
                or q in " ".join(item["tags"]).lower()
            ]
        if self.sort_mode == "A-Z":
            items.sort(key=lambda item: item["title"])
        elif self.sort_mode == "Horas":
            items.sort(key=lambda item: item["playtimeHours"], reverse=True)
        elif self.sort_mode == "Estado":
            items.sort(key=lambda item: item["playState"])
        else:
            items.sort(key=lambda item: item.get("lastPlayed", ""), reverse=True)
        return items

    def render_downloads(self):
        self.fill_card(self.download_card, [
            (game_for(self.data, item["gameId"])["title"], f'{item["status"]} · {item["progress"]}% · {item["totalGb"]} GB')
            for item in self.data["downloads"]
        ])
        self.clear_layout(self.downloads_card.layout)
        label = QLabel("Cola de descargas y actualizaciones")
        label.setObjectName("sectionTitle")
        self.downloads_card.layout.addWidget(label)
        for item in self.data["downloads"]:
            game = game_for(self.data, item["gameId"])
            row = QFrame()
            row.setObjectName("miniPanel")
            row_layout = QVBoxLayout(row)
            row_layout.addWidget(QLabel(f'<b>{game["title"]}</b> · {platform_for(self.data, item["platformId"])["name"]}'))
            progress = QProgressBar()
            progress.setValue(item["progress"])
            row_layout.addWidget(progress)
            row_layout.addWidget(QLabel(f'{item["status"]} · {item["downloadedGb"]}/{item["totalGb"]} GB · ETA {item.get("etaMinutes") or 0} min'))
            self.downloads_card.layout.addWidget(row)

    def render_social(self):
        self.clear_layout(self.friends_card.layout)
        title = QLabel("Amigos y actividad")
        title.setObjectName("sectionTitle")
        self.friends_card.layout.addWidget(title)
        for friend in self.data["friends"]:
            current = game_for(self.data, friend["currentGameId"]) if friend.get("currentGameId") else None
            self.friends_card.layout.addWidget(QLabel(f'<b>{friend["displayName"]}</b> · {friend["status"]}<br><span style="color:#9aa8ba">{current["title"] if current else "Sin juego actual"} · {platform_for(self.data, friend["platformId"])["name"]}</span>'))

    def render_platforms(self):
        self.clear_layout(self.platforms_grid)
        for index, item in enumerate(self.data["platforms"]):
            card = Card(item["name"])
            card.layout.addWidget(QLabel(item["account"]))
            card.layout.addWidget(QLabel(f'{item["libraryCount"]} juegos · {item["installedCount"]} instalados'))
            card.layout.addWidget(QLabel("Conectada" if item["connected"] else "Necesita login"))
            sync = QPushButton("Sincronizar")
            sync.clicked.connect(lambda _checked=False, name=item["name"]: self.toast(f"{name} sincronizando"))
            card.layout.addWidget(sync)
            self.platforms_grid.addWidget(card, index // 3, index % 3)

    def open_view(self, name):
        if name not in self.pages:
            return
        self.current_view = name
        self.title_label.setText({
            "Inicio": "Centro de mando",
            "Biblioteca": "Biblioteca unificada",
            "Descargas": "Descargas",
            "Social": "Social y actividad",
            "Plataformas": "Plataformas conectadas",
            "Ajustes": "Ajustes",
        }[name])
        self.stack.setCurrentWidget(self.pages[name])

    def on_search(self, value):
        self.query = value.strip()
        self.render_library()
        if self.query:
            self.nav.setCurrentRow(1)

    def on_platform_filter(self):
        self.platform_filter = self.platform_combo.currentData()
        self.render_library()

    def on_sort(self, value):
        self.sort_mode = value
        self.render_library()

    def on_filter_checks(self):
        self.only_installed = self.installed_check.isChecked()
        self.only_favorites = self.fav_check.isChecked()
        self.only_updates = self.update_check.isChecked()
        self.render_library()

    def launch_game(self, game_id):
        item = game_for(self.data, game_id)
        if not item:
            return
        path = item.get("installPath")
        if path and Path(path).exists():
            os.startfile(path)
        self.toast(f'Abriendo {item["title"]}...')

    def open_detail(self, game_id):
        item = game_for(self.data, game_id)
        if item:
            DetailDialog(self, self.data, item).exec()

    def toggle_favorite(self, game_id):
        item = game_for(self.data, game_id)
        if item:
            item["favorite"] = not item["favorite"]
            self.render_all()
            self.toast(f'{item["title"]}: {"favorito" if item["favorite"] else "sin favorito"}')

    def toggle_big_picture(self):
        self.big_picture = not self.big_picture
        self.setProperty("bigPicture", self.big_picture)
        self.style().unpolish(self)
        self.style().polish(self)
        self.resize(1500, 920 if self.big_picture else 860)
        self.render_library()
        self.toast("Modo TV activado" if self.big_picture else "Modo escritorio activado")

    def open_command(self):
        options = ["Biblioteca", "Descargas", "Social", "Plataformas", "Ajustes"] + [item["title"] for item in self.data["games"]]
        dialog = QDialog(self)
        dialog.setWindowTitle("Comando rápido")
        dialog.setMinimumWidth(560)
        layout = QVBoxLayout(dialog)
        search = QLineEdit()
        search.setPlaceholderText("Escribe biblioteca, descargas o nombre de juego")
        results = QListWidget()
        for option in options:
            results.addItem(option)
        layout.addWidget(search)
        layout.addWidget(results)

        def filter_results(text):
            results.clear()
            for option in options:
                if text.lower() in option.lower():
                    results.addItem(option)

        def run():
            item = results.currentItem()
            if not item:
                return
            value = item.text()
            if value in self.pages:
                self.nav.setCurrentRow(list(self.pages).index(value))
            else:
                found = next((game for game in self.data["games"] if game["title"] == value), None)
                if found:
                    self.launch_game(found["id"])
            dialog.accept()

        search.textChanged.connect(filter_results)
        results.itemDoubleClicked.connect(lambda _item: run())
        search.returnPressed.connect(run)
        dialog.exec()

    def add_game_dialog(self):
        QMessageBox.information(self, "Agregar acceso", "Aquí conectaremos el selector real de .exe, .lnk, carpetas y URLs.")

    def toast(self, message):
        self.statusBar().showMessage(message, 2500)

    def apply_style(self):
        self.setStyleSheet(
            """
            QMainWindow { background: #06080d; color: #f5f7fb; }
            QWidget { background: #06080d; color: #f5f7fb; font-family: Segoe UI; font-size: 14px; }
            #sidebar {
                background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #101722, stop:1 #070a10);
                border-right: 1px solid #273346;
            }
            #brand {
                font-size: 24px;
                font-weight: 900;
                color: #f5f7fb;
                padding: 10px 8px 18px 8px;
                border-bottom: 1px solid #273346;
            }
            #sidePanel {
                background: rgba(255,255,255,.045);
                border: 1px solid #273346;
                border-radius: 10px;
            }
            #nav {
                background: transparent;
                border: 0;
                outline: 0;
                padding-top: 8px;
            }
            #nav::item {
                min-height: 52px;
                border-radius: 10px;
                color: #9ba8ba;
                padding-left: 16px;
                margin: 3px 0;
                font-size: 15px;
                font-weight: 700;
            }
            #nav::item:hover {
                background: rgba(255,255,255,.055);
                color: #f5f7fb;
            }
            #nav::item:selected {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 rgba(87,215,191,.28), stop:1 rgba(126,165,255,.10));
                color: #ffffff;
                border: 1px solid #57d7bf;
            }
            #pageTitle {
                font-size: 42px;
                font-weight: 900;
                letter-spacing: 0;
            }
            QLineEdit, QComboBox {
                min-height: 48px;
                border: 1px solid #2d3a4d;
                border-radius: 10px;
                background: #101722;
                padding: 0 14px;
                selection-background-color: #57d7bf;
            }
            QLineEdit:focus, QComboBox:focus {
                border: 1px solid #57d7bf;
            }
            QCheckBox { color: #cdd6e3; spacing: 8px; font-weight: 650; }
            QPushButton {
                min-height: 42px;
                border: 1px solid #2d3a4d;
                border-radius: 10px;
                background: #182230;
                padding: 0 14px;
                font-weight: 800;
            }
            QPushButton:hover {
                border-color: #57d7bf;
                background: #223045;
            }
            #primaryButton {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #57d7bf, stop:1 #7ea5ff);
                color: #06110f;
                border: 0;
                min-height: 46px;
            }
            #favButton { min-width: 46px; font-size: 18px; }
            #card, #gameCard, #miniPanel {
                background: qlineargradient(x1:0,y1:0,x2:0,y2:1, stop:0 #121a26, stop:1 #0d121a);
                border: 1px solid #273346;
                border-radius: 12px;
            }
            #gameCard:hover {
                border: 1px solid #57d7bf;
                background: #162131;
            }
            #featured {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 #151f2e, stop:.48 #0c1119, stop:1 #101824);
                border: 1px solid #314057;
                border-radius: 14px;
            }
            #heroArt {
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.10);
            }
            #sectionTitle {
                font-size: 21px;
                font-weight: 900;
                padding-bottom: 4px;
            }
            #gameTitle { font-size: 18px; font-weight: 900; }
            #heroTitle {
                font-size: 60px;
                font-weight: 900;
                line-height: 94%;
            }
            #heroStats {
                color: #57d7bf;
                font-size: 12px;
                font-weight: 900;
                letter-spacing: 1px;
                padding: 8px 0;
            }
            #eyebrow {
                color: #57d7bf;
                font-size: 12px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            #muted { color: #9ba8ba; font-size: 14px; }
            #rowLabel {
                background: rgba(255,255,255,.045);
                border: 1px solid #273346;
                border-radius: 10px;
                padding: 12px;
            }
            #rowLabel:hover {
                background: rgba(87,215,191,.08);
                border: 1px solid rgba(87,215,191,.45);
            }
            QProgressBar {
                border: 1px solid #2d3a4d;
                border-radius: 6px;
                background: #070a0f;
                height: 12px;
                text-align: center;
            }
            QProgressBar::chunk {
                border-radius: 6px;
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #57d7bf, stop:1 #7ea5ff);
            }
            QScrollArea { border: 0; background: transparent; }
            QScrollBar:vertical {
                background: #090d13;
                width: 10px;
                margin: 0;
            }
            QScrollBar::handle:vertical {
                background: #2d3a4d;
                border-radius: 5px;
            }
            """
        )


def main():
    app = QApplication(sys.argv)
    window = DesktopLauncher()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
