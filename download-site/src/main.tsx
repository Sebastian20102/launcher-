import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Bot, Cpu, Download, FolderOpen, Gamepad2, GitBranch, HardDrive, Layers3, Menu, MonitorCog, Palette, Shield, Sparkles, X } from "lucide-react";
import "./styles.css";
import "./components.css";

const releaseUrl = "https://github.com/Sebastian20102/launcher-/releases/latest";
const repoUrl = "https://github.com/Sebastian20102/launcher-";

const items = [
  { name: "Steam", type: "Juego", meta: "Valve", detail: "Biblioteca principal, Big Picture y juegos instalados.", icon: Gamepad2 },
  { name: "VS Code", type: "Programa", meta: "Microsoft", detail: "Editor principal para prototipos, scripts y launcher.", icon: Cpu },
  { name: "Unreal Projects", type: "Proyecto", meta: "Local", detail: "Carpeta local con proyectos y assets activos.", icon: FolderOpen },
  { name: "Nexus Copilot", type: "Programa", meta: "IA local", detail: "Asistente con memoria local y herramientas del launcher.", icon: Bot },
];

const featureCards = [
  ["Biblioteca local", "Agrega juegos, programas, carpetas, proyectos y archivos sin subir tus rutas."],
  ["Personalizacion viva", "Wallpapers, GIFs, video, glass, densidad y perfiles que cambian la sensacion completa."],
  ["Notas y limpieza", "Notas con tags, busqueda, filtros, duplicados seguros y metadata local revisable."],
  ["IA local opcional", "Preparado para LM Studio, Ollama u OpenAI con memoria por usuario."],
];

const ecosystem = ["Steam", "GOG", "Battle.net", "Epic", "VS Code", "Unreal", "LM Studio", "Ollama", "GitHub", "Windows"];

const stackCards = [
  { title: "Biblioteca real", text: "Reconoce programas, juegos, carpetas y archivos locales por usuario.", icon: Layers3 },
  { title: "Personalizacion", text: "Fondos estaticos, GIF, video, glass y perfiles visuales sin romper rendimiento.", icon: Palette },
  { title: "IA local", text: "Copilot con memoria local, preparado para analizar archivos y organizar la biblioteca.", icon: Bot },
  { title: "PC awareness", text: "Base para detectar componentes, estado del sistema y rutas importantes.", icon: MonitorCog },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [filter, setFilter] = useState("Todo");
  const [selected, setSelected] = useState(items[0]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.35 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: containerProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const rotateX = useTransform(containerProgress, [0, 0.5, 1], [10, 0, -6]);
  const scale = useTransform(containerProgress, [0, 0.5, 1], [0.92, 1.02, 0.96]);
  const y = useTransform(containerProgress, [0, 1], [72, -42]);

  const visibleItems = useMemo(() => (filter === "Todo" ? items : items.filter((item) => item.type === filter)), [filter]);

  function selectFilter(nextFilter: string) {
    setFilter(nextFilter);
    const nextItems = nextFilter === "Todo" ? items : items.filter((item) => item.type === nextFilter);
    setSelected(nextItems[0] ?? items[0]);
  }

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <BackgroundField />
      <AnimatePresence>
        {bannerOpen && (
          <motion.div className="upgrade-banner" initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -48, opacity: 0 }}>
            <span className="banner-dot" />
            <p><strong>Nexus Alpha</strong> ya piensa como launcher: local, personalizable y listo para IA.</p>
            <a href={releaseUrl}>Descargar ahora</a>
            <button type="button" onClick={() => setBannerOpen(false)} aria-label="Cerrar banner"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark">N</span><span><strong>Nexus Launcher</strong><small>Windows Alpha</small></span></a>
        <nav><a href="#experience">Experiencia</a><a href="#features">Funciones</a><a href="#privacy">Privacidad</a><a href="#install">Instalar</a><a href={repoUrl}>GitHub</a></nav>
        <button className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu"><Menu size={20} /></button>
      </header>

      <AnimatePresence>
        {menuOpen && <MobileMenu close={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <main id="top">
        <section className="hero">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <div className="signal-pill"><span /> build publica v0.1.0-alpha</div>
            <p className="eyebrow">Launcher local para Windows</p>
            <h1>Un centro de mando para tu PC.</h1>
            <p className="lead">Nexus no es una lista de accesos. Es una biblioteca local con estilo de consola: programas, juegos, proyectos, notas, fondos dinamicos y un asistente que aprende de tu flujo.</p>
            <div className="hero-actions">
              <motion.a className="button primary" href={releaseUrl} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}><Download size={18} /> Descargar alpha</motion.a>
              <motion.a className="button secondary" href={repoUrl} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}><GitBranch size={18} /> Ver repo</motion.a>
            </div>
            <div className="status-row"><span>sin servidor local</span><span>datos por usuario</span><span>IA opcional</span></div>
          </motion.div>

          <motion.div className="hero-stage" initial={{ opacity: 0, rotateX: 8, rotateY: -10, y: 38 }} animate={{ opacity: 1, rotateX: 2, rotateY: -5, y: 0 }} transition={{ duration: 1, delay: 0.12 }}>
            <FloatingStat className="stat-a" label="Biblioteca" value="Local" />
            <FloatingStat className="stat-b" label="Personalizacion" value="Glass" />
            <FloatingStat className="stat-c" label="Copilot" value="Local IA" />
            <div className="product-frame">
              <MiniLauncher selected={selected} visibleItems={visibleItems} filter={filter} onFilter={selectFilter} onSelect={setSelected} />
            </div>
          </motion.div>
        </section>

        <Marquee />
        <LogoCarousel />

        <section id="experience" ref={containerRef} className="container-scroll-stage">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Container Scroll Animation</p><h2>La pagina debe vender la sensacion del launcher.</h2></div>
            <p>Scroll con profundidad, modulo vivo y capas que responden como una app real, no como folleto estatico.</p>
          </div>
          <motion.div className="scroll-device" style={{ rotateX, scale, y }}>
            <div className="device-toolbar"><span /><span /><span /><b>Nexus Core</b></div>
            <div className="device-grid">
              {["Juegos", "Programas", "Proyectos", "Copilot", "Notas", "PC"].map((entry, index) => <motion.article key={entry} whileHover={{ y: -8, scale: 1.03 }}><small>0{index + 1}</small>{entry}</motion.article>)}
            </div>
          </motion.div>
        </section>

        <section id="features" className="section">
          <SectionTitle eyebrow="Alpha funcional" title="Menos landing. Mas producto." />
          <div className="feature-grid">
            {featureCards.map(([title, text], index) => (
              <motion.article key={title} whileHover={{ y: -10, rotateX: 5 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <MorphingCardStack />

        <section id="privacy" className="split-section">
          <SectionTitle eyebrow="Privacidad" title="El repo no trae tus programas, iconos ni memoria." />
          <div className="glass-list">
            <p><Shield size={18} /> La biblioteca vive en <code>%APPDATA%\Nexus Launcher</code>.</p>
            <p><HardDrive size={18} /> Cada persona que lo instale genera su propia biblioteca local.</p>
            <p><Bot size={18} /> La IA puede funcionar localmente con LM Studio u Ollama.</p>
          </div>
        </section>

        <section id="install" className="install-card">
          <div><p className="eyebrow">Instalacion</p><h2>Descarga desde GitHub Releases.</h2></div>
          <ol><li>Abre la ultima release publica.</li><li>Descarga el instalador o portable.</li><li>Ejecuta Nexus Launcher sin iniciar servidor local.</li></ol>
          <motion.a className="button primary" href={releaseUrl} whileHover={{ y: -3, scale: 1.02 }}><Sparkles size={18} /> Ir a la descarga</motion.a>
        </section>
      </main>

      <div className="mobile-dock"><a href="#top">Inicio</a><a href="#features">Funciones</a><a href="#install">Descarga</a></div>
      <footer><span>Nexus Launcher Alpha</span><span>React, Framer Motion y Electron.</span></footer>
    </>
  );
}

function MobileMenu({ close }: { close: () => void }) {
  return (
    <motion.div className="mobile-menu" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}>
      {["Experiencia", "Funciones", "Privacidad", "Instalar"].map((entry) => (
        <a key={entry} href={`#${entry === "Experiencia" ? "experience" : entry === "Funciones" ? "features" : entry === "Privacidad" ? "privacy" : "install"}`} onClick={close}>{entry}</a>
      ))}
      <a href={repoUrl}>GitHub</a>
    </motion.div>
  );
}

function MiniLauncher({ selected, visibleItems, filter, onFilter, onSelect }: { selected: typeof items[number]; visibleItems: typeof items; filter: string; onFilter: (filter: string) => void; onSelect: (item: typeof items[number]) => void; }) {
  return (
    <>
      <div className="window-bar"><span /><span /><span /><b>Nexus Core Preview</b></div>
      <div className="launcher-preview">
        <aside className="rail"><div className="tile active" /><div className="tile" /><div className="tile" /></aside>
        <section>
          <div className="search">Buscar juegos, programas o proyectos</div>
          <div className="preview-tabs">{["Todo", "Juego", "Programa", "Proyecto"].map((entry) => <button key={entry} className={filter === entry ? "active" : ""} onClick={() => onFilter(entry)}>{entry}</button>)}</div>
          <div className="grid">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.article layout key={item.name} className={selected.name === item.name ? "active" : ""} onClick={() => onSelect(item)} initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -8 }} whileHover={{ y: -5 }}>
                    <Icon size={18} /><b>{item.name}</b><small>{item.type}</small>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
        <aside className="detail"><b>{selected.name}</b><span>{selected.type} | {selected.meta}</span><button>Abrir ahora</button><small>{selected.detail}</small></aside>
      </div>
    </>
  );
}

function FloatingStat({ label, value, className }: { label: string; value: string; className: string }) {
  return <motion.div className={`floating-stat ${className}`} animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}><small>{label}</small><b>{value}</b></motion.div>;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>;
}

function LogoCarousel() {
  return (
    <section className="logo-carousel-section" aria-label="Ecosistema conectado">
      <div className="logo-copy">
        <p className="eyebrow">Logo Carousel</p>
        <h2>Ecosistema conectado.</h2>
      </div>
      <div className="logo-carousel">
        <div className="logo-track">
          {[...ecosystem, ...ecosystem].map((name, index) => (
            <span key={`${name}-${index}`} className="logo-chip">
              <LogoMark name={name} /> {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoMark({ name }: { name: string }) {
  const first = name.slice(0, 1);
  return <span className="logo-mark">{first}</span>;
}

function MorphingCardStack() {
  const [active, setActive] = useState(0);
  const activeCard = stackCards[active];
  const ActiveIcon = activeCard.icon;
  return (
    <section className="morph-section">
      <div className="section-heading split-heading">
        <div><p className="eyebrow">Morphing Card Stack</p><h2>El roadmap se siente como modulo vivo.</h2></div>
        <p>Cambia de capa y mira como la tarjeta activa se expande mientras el resto queda apilado detras.</p>
      </div>
      <div className="morph-layout">
        <div className="stack-controls">
          {stackCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <button key={card.title} className={active === index ? "active" : ""} onClick={() => setActive(index)}>
                <Icon size={17} /> {card.title}
              </button>
            );
          })}
        </div>
        <div className="morph-stack" aria-live="polite">
          {stackCards.map((card, index) => {
            const distance = (index - active + stackCards.length) % stackCards.length;
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                className={`morph-card ${index === active ? "active" : ""}`}
                animate={{
                  x: distance * 18,
                  y: distance * 18,
                  scale: index === active ? 1 : 0.94 - distance * 0.025,
                  opacity: index === active ? 1 : Math.max(0.25, 0.72 - distance * 0.16),
                  zIndex: stackCards.length - distance,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div className="morph-icon"><Icon size={24} /></div>
                <span>0{index + 1}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                {index === active && (
                  <motion.div className="morph-active-line" layoutId="morph-line">
                    <ActiveIcon size={16} /> listo para la siguiente alpha
                  </motion.div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const text = ["Biblioteca local", "Wallpapers dinamicos", "Notas con tags", "IA local opcional", "Limpieza segura", "Metadata real"];
  return <section className="marquee-section"><div className="marquee-track">{[...text, ...text].map((entry, index) => <span key={`${entry}-${index}`}>{entry}</span>)}</div></section>;
}

function BackgroundField() {
  return <><div className="wave-background" /><div className="grain" /></>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
