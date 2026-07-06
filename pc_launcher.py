import json
import os
import subprocess
import sys
import webbrowser
from dataclasses import dataclass, asdict
from pathlib import Path
from tkinter import (
    BOTH,
    BOTTOM,
    END,
    LEFT,
    RIGHT,
    TOP,
    X,
    Y,
    BooleanVar,
    filedialog,
    messagebox,
    simpledialog,
)
import tkinter as tk
from tkinter import ttk


APP_NAME = "Mi Launcher"
DATA_FILE = Path(__file__).with_name("launcher_items.json")

BG = "#111318"
PANEL = "#191d25"
PANEL_2 = "#202633"
TEXT = "#eef2f7"
MUTED = "#9aa4b2"
ACCENT = "#4cc9a7"
ACCENT_2 = "#7aa2ff"
DANGER = "#ff6b6b"


@dataclass
class LauncherItem:
    name: str
    path: str
    category: str = "General"
    favorite: bool = False
    kind: str = "app"

    @classmethod
    def from_dict(cls, value):
        return cls(
            name=str(value.get("name", "")).strip(),
            path=str(value.get("path", "")).strip(),
            category=str(value.get("category", "General")).strip() or "General",
            favorite=bool(value.get("favorite", False)),
            kind=str(value.get("kind", "app")).strip() or "app",
        )


class LauncherStore:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.items = []
        self.load()

    def load(self):
        if not self.file_path.exists():
            self.items = []
            return

        try:
            raw = json.loads(self.file_path.read_text(encoding="utf-8"))
            self.items = [LauncherItem.from_dict(item) for item in raw if item.get("name") and item.get("path")]
        except (OSError, json.JSONDecodeError) as exc:
            messagebox.showerror(APP_NAME, f"No pude leer {self.file_path.name}.\n\n{exc}")
            self.items = []

    def save(self):
        payload = [asdict(item) for item in self.items]
        self.file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    def add(self, item: LauncherItem):
        self.items.append(item)
        self.save()

    def delete(self, item: LauncherItem):
        self.items.remove(item)
        self.save()

    def categories(self):
        values = {"Todos", "Favoritos"}
        values.update(item.category for item in self.items)
        return sorted(values, key=lambda value: (value not in ("Todos", "Favoritos"), value.lower()))


class ItemDialog(tk.Toplevel):
    def __init__(self, parent, title, item=None):
        super().__init__(parent)
        self.title(title)
        self.configure(bg=BG)
        self.resizable(False, False)
        self.result = None
        self.transient(parent)
        self.grab_set()

        self.name_var = tk.StringVar(value=item.name if item else "")
        self.path_var = tk.StringVar(value=item.path if item else "")
        self.category_var = tk.StringVar(value=item.category if item else "General")
        self.favorite_var = BooleanVar(value=item.favorite if item else False)
        self.kind_var = tk.StringVar(value=item.kind if item else "app")

        body = tk.Frame(self, bg=BG, padx=18, pady=18)
        body.pack(fill=BOTH, expand=True)

        self._label(body, "Nombre").grid(row=0, column=0, sticky="w", pady=(0, 6))
        self._entry(body, self.name_var, width=42).grid(row=1, column=0, columnspan=2, sticky="ew", pady=(0, 12))

        self._label(body, "Ruta, acceso directo o URL").grid(row=2, column=0, sticky="w", pady=(0, 6))
        self._entry(body, self.path_var, width=42).grid(row=3, column=0, sticky="ew", pady=(0, 12))
        self._button(body, "Buscar", self.pick_path).grid(row=3, column=1, sticky="ew", padx=(8, 0), pady=(0, 12))

        self._label(body, "Categoría").grid(row=4, column=0, sticky="w", pady=(0, 6))
        self._entry(body, self.category_var).grid(row=5, column=0, columnspan=2, sticky="ew", pady=(0, 12))

        self._label(body, "Tipo").grid(row=6, column=0, sticky="w", pady=(0, 6))
        kind = ttk.Combobox(body, textvariable=self.kind_var, values=("app", "game", "tool", "url"), state="readonly")
        kind.grid(row=7, column=0, columnspan=2, sticky="ew", pady=(0, 12))

        favorite = tk.Checkbutton(
            body,
            text="Marcar como favorito",
            variable=self.favorite_var,
            bg=BG,
            fg=TEXT,
            activebackground=BG,
            activeforeground=TEXT,
            selectcolor=PANEL_2,
        )
        favorite.grid(row=8, column=0, columnspan=2, sticky="w", pady=(0, 16))

        footer = tk.Frame(body, bg=BG)
        footer.grid(row=9, column=0, columnspan=2, sticky="e")
        self._button(footer, "Cancelar", self.destroy).pack(side=LEFT, padx=(0, 8))
        self._button(footer, "Guardar", self.save, accent=True).pack(side=LEFT)

        body.columnconfigure(0, weight=1)
        self.bind("<Return>", lambda _event: self.save())
        self.bind("<Escape>", lambda _event: self.destroy())

        self.update_idletasks()
        x = parent.winfo_rootx() + (parent.winfo_width() - self.winfo_width()) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - self.winfo_height()) // 2
        self.geometry(f"+{max(x, 0)}+{max(y, 0)}")

    def _label(self, parent, text):
        return tk.Label(parent, text=text, bg=BG, fg=MUTED, font=("Segoe UI", 9))

    def _entry(self, parent, variable, width=None):
        return tk.Entry(
            parent,
            textvariable=variable,
            width=width,
            bg=PANEL,
            fg=TEXT,
            insertbackground=TEXT,
            relief="flat",
            highlightthickness=1,
            highlightbackground=PANEL_2,
            highlightcolor=ACCENT,
            font=("Segoe UI", 10),
        )

    def _button(self, parent, text, command, accent=False):
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=ACCENT if accent else PANEL_2,
            fg="#07110f" if accent else TEXT,
            activebackground=ACCENT_2 if accent else "#2b3445",
            activeforeground=TEXT,
            relief="flat",
            padx=12,
            pady=7,
            font=("Segoe UI", 9, "bold"),
            cursor="hand2",
        )

    def pick_path(self):
        selected = filedialog.askopenfilename(
            title="Elige un programa, juego o acceso directo",
            filetypes=[
                ("Programas y accesos directos", "*.exe *.lnk *.bat *.cmd *.url"),
                ("Todos los archivos", "*.*"),
            ],
        )
        if selected:
            self.path_var.set(selected)
            if not self.name_var.get().strip():
                self.name_var.set(Path(selected).stem)

    def save(self):
        name = self.name_var.get().strip()
        path = self.path_var.get().strip()
        if not name or not path:
            messagebox.showwarning(APP_NAME, "Necesito al menos un nombre y una ruta.")
            return

        self.result = LauncherItem(
            name=name,
            path=path,
            category=self.category_var.get().strip() or "General",
            favorite=self.favorite_var.get(),
            kind=self.kind_var.get().strip() or "app",
        )
        self.destroy()


class LauncherApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_NAME)
        self.geometry("1040x680")
        self.minsize(820, 520)
        self.configure(bg=BG)

        self.store = LauncherStore(DATA_FILE)
        self.search_var = tk.StringVar()
        self.category_var = tk.StringVar(value="Todos")
        self.status_var = tk.StringVar(value=f"{len(self.store.items)} elementos")
        self.selected_item = None

        self._style()
        self._build()
        self.refresh()

    def _style(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("Treeview", background=PANEL, foreground=TEXT, fieldbackground=PANEL, rowheight=34, borderwidth=0)
        style.configure("Treeview.Heading", background=PANEL_2, foreground=TEXT, relief="flat", font=("Segoe UI", 9, "bold"))
        style.map("Treeview", background=[("selected", "#2f4057")], foreground=[("selected", TEXT)])
        style.configure("TCombobox", fieldbackground=PANEL, background=PANEL_2, foreground=TEXT, arrowcolor=TEXT)

    def _build(self):
        header = tk.Frame(self, bg=BG, padx=20, pady=18)
        header.pack(side=TOP, fill=X)

        title_box = tk.Frame(header, bg=BG)
        title_box.pack(side=LEFT)
        tk.Label(title_box, text=APP_NAME, bg=BG, fg=TEXT, font=("Segoe UI", 24, "bold")).pack(anchor="w")
        tk.Label(title_box, text="Juegos, programas y accesos directos en un solo lugar", bg=BG, fg=MUTED, font=("Segoe UI", 10)).pack(anchor="w")

        actions = tk.Frame(header, bg=BG)
        actions.pack(side=RIGHT)
        self._button(actions, "Escanear", self.scan_shortcuts).pack(side=LEFT, padx=(0, 8))
        self._button(actions, "Agregar", self.add_item, accent=True).pack(side=LEFT)

        toolbar = tk.Frame(self, bg=BG, padx=20)
        toolbar.pack(side=TOP, fill=X, pady=(0, 14))

        search = tk.Entry(
            toolbar,
            textvariable=self.search_var,
            bg=PANEL,
            fg=TEXT,
            insertbackground=TEXT,
            relief="flat",
            highlightthickness=1,
            highlightbackground=PANEL_2,
            highlightcolor=ACCENT,
            font=("Segoe UI", 11),
        )
        search.pack(side=LEFT, fill=X, expand=True, ipady=9)
        search.insert(0, "")
        self.search_var.trace_add("write", lambda *_args: self.refresh())

        self.category_menu = ttk.Combobox(toolbar, textvariable=self.category_var, state="readonly", width=18)
        self.category_menu.pack(side=LEFT, padx=(10, 0), ipady=6)
        self.category_menu.bind("<<ComboboxSelected>>", lambda _event: self.refresh())

        content = tk.Frame(self, bg=BG, padx=20)
        content.pack(side=TOP, fill=BOTH, expand=True)

        list_panel = tk.Frame(content, bg=PANEL)
        list_panel.pack(side=LEFT, fill=BOTH, expand=True)

        columns = ("name", "category", "kind", "path")
        self.tree = ttk.Treeview(list_panel, columns=columns, show="headings", selectmode="browse")
        self.tree.heading("name", text="Nombre")
        self.tree.heading("category", text="Categoría")
        self.tree.heading("kind", text="Tipo")
        self.tree.heading("path", text="Ruta")
        self.tree.column("name", minwidth=180, width=250)
        self.tree.column("category", minwidth=100, width=140)
        self.tree.column("kind", minwidth=70, width=90, anchor="center")
        self.tree.column("path", minwidth=240, width=420)
        self.tree.pack(side=LEFT, fill=BOTH, expand=True)
        self.tree.bind("<<TreeviewSelect>>", self.on_select)
        self.tree.bind("<Double-1>", lambda _event: self.launch_selected())
        self.tree.bind("<Return>", lambda _event: self.launch_selected())

        scroll = ttk.Scrollbar(list_panel, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        scroll.pack(side=RIGHT, fill=Y)

        side = tk.Frame(content, bg=BG, width=220)
        side.pack(side=RIGHT, fill=Y, padx=(16, 0))
        side.pack_propagate(False)

        self._side_button(side, "Abrir", self.launch_selected, ACCENT, "#07110f").pack(fill=X, pady=(0, 10))
        self._side_button(side, "Editar", self.edit_selected, PANEL_2, TEXT).pack(fill=X, pady=(0, 10))
        self._side_button(side, "Favorito", self.toggle_favorite, PANEL_2, TEXT).pack(fill=X, pady=(0, 10))
        self._side_button(side, "Eliminar", self.delete_selected, "#3a2227", DANGER).pack(fill=X, pady=(0, 22))
        self._side_button(side, "Abrir carpeta", self.open_location, PANEL_2, TEXT).pack(fill=X, pady=(0, 10))
        self._side_button(side, "Exportar lista", self.export_list, PANEL_2, TEXT).pack(fill=X)

        footer = tk.Frame(self, bg=BG, padx=20, pady=12)
        footer.pack(side=BOTTOM, fill=X)
        tk.Label(footer, textvariable=self.status_var, bg=BG, fg=MUTED, font=("Segoe UI", 9)).pack(side=LEFT)
        tk.Label(footer, text="Doble clic o Enter para abrir", bg=BG, fg=MUTED, font=("Segoe UI", 9)).pack(side=RIGHT)

    def _button(self, parent, text, command, accent=False):
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=ACCENT if accent else PANEL_2,
            fg="#07110f" if accent else TEXT,
            activebackground=ACCENT_2 if accent else "#2b3445",
            activeforeground=TEXT,
            relief="flat",
            padx=14,
            pady=9,
            font=("Segoe UI", 10, "bold"),
            cursor="hand2",
        )

    def _side_button(self, parent, text, command, bg, fg):
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=bg,
            fg=fg,
            activebackground="#2b3445",
            activeforeground=TEXT,
            relief="flat",
            padx=12,
            pady=12,
            font=("Segoe UI", 10, "bold"),
            cursor="hand2",
        )

    def filtered_items(self):
        query = self.search_var.get().strip().lower()
        category = self.category_var.get()
        items = self.store.items
        if category == "Favoritos":
            items = [item for item in items if item.favorite]
        elif category and category != "Todos":
            items = [item for item in items if item.category == category]

        if query:
            items = [
                item
                for item in items
                if query in item.name.lower()
                or query in item.path.lower()
                or query in item.category.lower()
                or query in item.kind.lower()
            ]
        return sorted(items, key=lambda item: (not item.favorite, item.category.lower(), item.name.lower()))

    def refresh(self):
        current_categories = self.store.categories()
        self.category_menu["values"] = current_categories
        if self.category_var.get() not in current_categories:
            self.category_var.set("Todos")

        self.tree.delete(*self.tree.get_children())
        self.visible_items = self.filtered_items()
        for index, item in enumerate(self.visible_items):
            star = "* " if item.favorite else ""
            self.tree.insert("", END, iid=str(index), values=(f"{star}{item.name}", item.category, item.kind, item.path))
        self.selected_item = None
        self.status_var.set(f"{len(self.visible_items)} visibles de {len(self.store.items)} elementos")

    def on_select(self, _event=None):
        selection = self.tree.selection()
        self.selected_item = self.visible_items[int(selection[0])] if selection else None

    def add_item(self):
        dialog = ItemDialog(self, "Agregar elemento")
        self.wait_window(dialog)
        if dialog.result:
            self.store.add(dialog.result)
            self.refresh()

    def edit_selected(self):
        item = self.require_selection()
        if not item:
            return
        dialog = ItemDialog(self, "Editar elemento", item)
        self.wait_window(dialog)
        if dialog.result:
            index = self.store.items.index(item)
            self.store.items[index] = dialog.result
            self.store.save()
            self.refresh()

    def delete_selected(self):
        item = self.require_selection()
        if not item:
            return
        if messagebox.askyesno(APP_NAME, f"¿Eliminar '{item.name}' del launcher?"):
            self.store.delete(item)
            self.refresh()

    def toggle_favorite(self):
        item = self.require_selection()
        if not item:
            return
        item.favorite = not item.favorite
        self.store.save()
        self.refresh()

    def launch_selected(self):
        item = self.require_selection()
        if not item:
            return
        launch_path(item.path)

    def open_location(self):
        item = self.require_selection()
        if not item:
            return
        path = item.path.strip()
        if is_url(path):
            webbrowser.open(path)
            return
        target = Path(path)
        location = target if target.is_dir() else target.parent
        if location.exists():
            os.startfile(str(location))
        else:
            messagebox.showwarning(APP_NAME, "No encontré la carpeta de ese elemento.")

    def export_list(self):
        target = filedialog.asksaveasfilename(
            title="Exportar lista",
            defaultextension=".json",
            filetypes=[("JSON", "*.json")],
        )
        if target:
            Path(target).write_text(DATA_FILE.read_text(encoding="utf-8") if DATA_FILE.exists() else "[]", encoding="utf-8")
            messagebox.showinfo(APP_NAME, "Lista exportada.")

    def scan_shortcuts(self):
        found = scan_windows_shortcuts()
        if not found:
            messagebox.showinfo(APP_NAME, "No encontré accesos directos nuevos.")
            return

        existing_paths = {item.path.lower() for item in self.store.items}
        new_items = [item for item in found if item.path.lower() not in existing_paths]
        if not new_items:
            messagebox.showinfo(APP_NAME, "Ya tienes agregados los accesos directos encontrados.")
            return

        limit = simpledialog.askinteger(
            APP_NAME,
            f"Encontré {len(new_items)} accesos directos nuevos.\n¿Cuántos quieres importar?",
            initialvalue=min(len(new_items), 25),
            minvalue=1,
            maxvalue=len(new_items),
        )
        if not limit:
            return

        self.store.items.extend(new_items[:limit])
        self.store.save()
        self.refresh()
        messagebox.showinfo(APP_NAME, f"Importé {limit} accesos directos.")

    def require_selection(self):
        if self.selected_item:
            return self.selected_item
        messagebox.showinfo(APP_NAME, "Selecciona un elemento primero.")
        return None


def is_url(value: str):
    lower = value.lower()
    return lower.startswith(("http://", "https://", "steam://", "epicgames://", "ubisoftconnect://", "xbox://"))


def launch_path(value: str):
    value = value.strip()
    try:
        if is_url(value):
            webbrowser.open(value)
        elif sys.platform.startswith("win"):
            os.startfile(value)
        else:
            subprocess.Popen([value])
    except OSError as exc:
        messagebox.showerror(APP_NAME, f"No pude abrirlo.\n\n{exc}")


def scan_windows_shortcuts():
    if not sys.platform.startswith("win"):
        return []

    roots = [
        Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
        Path(os.environ.get("PROGRAMDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
        Path.home() / "Desktop",
        Path(os.environ.get("PUBLIC", "C:/Users/Public")) / "Desktop",
    ]

    items = []
    seen = set()
    for root in roots:
        if not root.exists():
            continue
        for shortcut in root.rglob("*.lnk"):
            key = str(shortcut).lower()
            if key in seen:
                continue
            seen.add(key)
            category = shortcut.parent.name if shortcut.parent != root else "General"
            items.append(
                LauncherItem(
                    name=shortcut.stem,
                    path=str(shortcut),
                    category=category,
                    kind="app",
                )
            )
    return sorted(items, key=lambda item: item.name.lower())


if __name__ == "__main__":
    app = LauncherApp()
    app.mainloop()
