import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Download, GitBranch, Menu, Shield, Sparkles, X } from "lucide-react";
import "./styles.css";

const releaseUrl = "https://github.com/Sebastian20102/launcher-/releases/latest";
const repoUrl = "https://github.com/Sebastian20102/launcher-";

const items = [
  { name: "Steam", type: "Juego", meta: "Valve", detail: "Biblioteca principal, Big Picture y juegos instalados." },
  { name: "VS Code", type: "Programa", meta: "Microsoft", detail: "Editor principal para prototipos, scripts y launcher." },
  { name: "Unreal Projects", type: "Proyecto", meta: "Local", detail: "Carpeta local con proyectos y assets activos." },
  { name: "Nexus Copilot", type: "Programa", meta: "IA local", detail: "Asistente con memoria local y herramientas del launcher." },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [filter, setFilter] = useState("Todo");
  const [selected, setSelected] = useState(items[0]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.35 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: containerProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(containerProgress, [0, 0.5, 1], [8, 1, -4]);
  const scale = useTransform(containerProgress, [0, 0.5, 1], [0.96, 1, 0.98]);
  const y = useTransform(containerProgress, [0, 1], [40, -20]);

  const visibleItems = useMemo(() => {
    return filter === "Todo" ? items : items.filter((item) => item.type === filter);
  }, [filter]);

  function selectFilter(nextFilter: string) {
    setFilter(nextFilter);
    const nextItems = nextFilter === "Todo" ? items : items.filter((item) => item.type === nextFilter);
    setSelected(nextItems[0] ?? items[0]);
  }

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <WaveBackground />
      <AnimatePresence>
        {bannerOpen && (
          <motion.div
            className="upgrade-banner"
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
          >
            <span className="banner-dot" />
            <p><strong>Nexus Alpha</strong> prepara personalizacion, notas, limpieza e IA local.</p>
            <a href={releaseUrl}>Descargar ahora</a>
            <button type="button" onClick={() => setBannerOpen(false)} aria-label="Cerrar banner">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark">N</span>
          <span><strong>Nexus Launcher</strong><small>Windows Alpha</small></span>
        </a>
        <nav>
          <a href="#features">Funciones</a>
          <a href="#privacy">Privacidad</a>
          <a href="#install">Instalar</a>
          <a href={repoUrl}>GitHub</a>
        </nav>
        <button className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {["Funciones", "Privacidad", "Instalar"].map((entry) => (
              <a key={entry} href={`#${entry === "Funciones" ? "features" : entry === "Privacidad" ? "privacy" : "install"}`} onClick={() => setMenuOpen(false)}>
                {entry}
              </a>
            ))}
            <a href={repoUrl}>GitHub</a>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="top">
        <section className="hero">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="eyebrow">Launcher local para Windows</p>
            <h1>Tu biblioteca de juegos, programas y proyectos en un solo lugar.</h1>
            <p className="lead">
              Nexus Launcher organiza accesos locales, abre apps reales desde el escritorio, guarda notas,
              permite wallpapers dinamicos y prepara una IA local sin convertir todo en menus.
            </p>
            <div className="hero-actions">
              <a className="button primary" href={releaseUrl}><Download size={18} /> Descargar alpha</a>
              <a className="button secondary" href={repoUrl}><GitBranch size={18} /> GitHub</a>
            </div>
            <div className="status-row"><span>v0.1.0-alpha</span><span>Windows 10/11</span><span>Datos locales</span></div>
          </motion.div>

          <motion.div className="product-frame" initial={{ opacity: 0, rotateX: 8, rotateY: -8, y: 30 }} animate={{ opacity: 1, rotateX: 3, rotateY: -4, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
            <MiniLauncher selected={selected} visibleItems={visibleItems} filter={filter} onFilter={selectFilter} onSelect={setSelected} />
          </motion.div>
        </section>

        <Marquee />

        <section ref={containerRef} className="container-scroll-stage">
          <div className="section-heading">
            <p className="eyebrow">Container Scroll Animation</p>
            <h2>El launcher se siente como una consola local para tu PC.</h2>
          </div>
          <motion.div className="scroll-device" style={{ rotateX, scale, y }}>
            <div className="device-toolbar"><span /><span /><span /><b>Nexus Core</b></div>
            <div className="device-grid">
              {["Juegos", "Programas", "Proyectos", "Copilot", "Notas", "PC"].map((entry) => <article key={entry}>{entry}</article>)}
            </div>
          </motion.div>
        </section>

        <section id="features" className="section">
          <SectionTitle eyebrow="Alpha funcional" title="Hecho para escritorio, no para depender de un servidor local." />
          <div className="feature-grid">
            {[
              ["Biblioteca local", "Agrega juegos, programas, carpetas, proyectos y archivos."],
              ["Personalizacion visual", "Wallpapers, GIFs, video, glass, densidad y perfiles completos."],
              ["Notas y limpieza", "Notas con tags, busqueda, filtros, duplicados seguros y metadata local."],
              ["IA opcional", "Preparado para LM Studio, Ollama u OpenAI con memoria local."],
            ].map(([title, text], index) => (
              <motion.article key={title} whileHover={{ y: -8, rotateX: 4 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="privacy" className="split-section">
          <SectionTitle eyebrow="Privacidad" title="El repo no trae tus programas, tus iconos ni tu memoria." />
          <div className="glass-list">
            <p><Shield size={18} /> La biblioteca vive en <code>%APPDATA%\Nexus Launcher</code>.</p>
            <p>No se suben claves API, memoria IA, iconos locales ni rutas personales.</p>
            <p>La IA puede funcionar localmente con LM Studio u Ollama.</p>
          </div>
        </section>

        <section id="install" className="section install-card">
          <p className="eyebrow">Instalacion</p>
          <h2>Descarga desde GitHub Releases.</h2>
          <ol>
            <li>Abre la ultima release publica.</li>
            <li>Descarga el instalador o portable cuando este adjunto.</li>
            <li>Ejecuta Nexus Launcher sin iniciar servidor local.</li>
          </ol>
          <a className="button primary" href={releaseUrl}><Sparkles size={18} /> Ir a la descarga</a>
        </section>
      </main>

      <div className="mobile-dock"><a href="#top">Inicio</a><a href="#features">Funciones</a><a href="#install">Descarga</a></div>
      <footer><span>Nexus Launcher Alpha</span><span>React, Framer Motion y Electron.</span></footer>
    </>
  );
}

function MiniLauncher({ selected, visibleItems, filter, onFilter, onSelect }: {
  selected: typeof items[number];
  visibleItems: typeof items;
  filter: string;
  onFilter: (filter: string) => void;
  onSelect: (item: typeof items[number]) => void;
}) {
  return (
    <>
      <div className="window-bar"><span /><span /><span /></div>
      <div className="launcher-preview">
        <aside><div className="tile active" /><div className="tile" /><div className="tile" /></aside>
        <section>
          <div className="search" />
          <div className="preview-tabs">
            {["Todo", "Juego", "Programa", "Proyecto"].map((entry) => (
              <button key={entry} className={filter === entry ? "active" : ""} onClick={() => onFilter(entry)}>{entry}</button>
            ))}
          </div>
          <div className="grid">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => (
                <motion.article layout key={item.name} className={selected.name === item.name ? "active" : ""} onClick={() => onSelect(item)} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                  <b>{item.name}</b><small>{item.type}</small>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </section>
        <aside className="detail"><b>{selected.name}</b><span>{selected.type} | {selected.meta}</span><button>Abrir ahora</button><small>{selected.detail}</small></aside>
      </div>
    </>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>;
}

function Marquee() {
  const text = ["Biblioteca local", "Wallpapers dinamicos", "Notas con tags", "IA local opcional", "Limpieza segura", "Metadata real"];
  return <section className="marquee-section"><div className="marquee-track">{[...text, ...text].map((entry, index) => <span key={`${entry}-${index}`}>{entry}</span>)}</div></section>;
}

function WaveBackground() {
  return <div className="wave-background" />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
