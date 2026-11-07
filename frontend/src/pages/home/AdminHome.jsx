import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell.jsx";
import { clearSession } from "../../utils/session";
import "./AdminHome.css";

const IconUser = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLounge = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9"/>
    <path d="M3 9h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
    <path d="M7 15v3m10-3v3"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconSparkles = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>
  </svg>
);

const IconMenu = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconContract = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
);

const IconTag = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconCard = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="6" y1="15" x2="10" y2="15"/>
  </svg>
);

function AdminHome() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const sections = [
    {
      title: "Gestionar Clientes",
      description: "Listado, alta y edición de clientes",
      route: "/client",
      icon: <IconUser />,
      enabled: true
    },
    {
      title: "Gestionar Salones",
      description: "Administración de los salones",
      route: "/lounge",
      icon: <IconLounge />,
      enabled: true
    },
    {
      title: "Gestionar Reservas",
      description: "Listado y gestión de reservas pendientes",
      route: "/reservation",
      icon: <IconCalendar />,
      enabled: true
    },
    {
      title: "Gestionar Servicios Extras",
      description: "Listado, alta y edición de servicios extras",
      route: "/extraService",
      icon: <IconSparkles />,
      enabled: true
    },
    {
      title: "Gestionar Menús",
      description: "Listado, alta y edición de menúes",
      route: "/cardDetail",
      icon: <IconMenu />,
      enabled: true
    },
    {
      title: "Gestionar Contratos",
      description: "Revisión y seguimiento de contratos",
      route: "/contract",
      icon: <IconContract />,
      enabled: true
    },
    {
      title: "Gestionar Precios",
      description: "Valores de alquiler según tipo de salón",
      route: "/price",
      icon: <IconTag />,
      enabled: true
    },
    {
      title: "Gestionar Pagos",
      description: "Cuotas, señas, saldos y recordatorios",
      route: "/payment",
      icon: <IconCard />,
      enabled: true
    }
  ];

  return (
    <div className="admin-landing">
      <div className="admin-background" aria-hidden="true">
        <div className="admin-glow admin-glow-purple" />
        <div className="admin-glow admin-glow-cyan" />
        <div className="admin-grid-overlay" />
      </div>
      <div className="admin-overlay" />

      <header className="admin-bar">
        <a className="admin-logo">SALON STYLO</a>
        <div className="admin-bar-actions">
          <NotificationBell />
          <button type="button" className="admin-logout" onClick={handleLogout}>
            <IconLogout /> Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-panel">
          <h1 className="admin-panel-title">PANEL DE ADMINISTRACIÓN</h1>
          <p className="admin-panel-subtitle">GESTIONA TU SALON DE EVENTOS</p>
        </div>

        <div className="admin-grid">
          {sections.map((section) => (
            <button
              key={section.title}
              type="button"
              className="admin-card"
              onClick={() => section.enabled && navigate(section.route)}
              disabled={!section.enabled}
            >
              <div className="admin-card-icon">{section.icon}</div>
              <div className="admin-card-content">
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <div className="admin-card-arrow">
                <IconArrowRight />
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="admin-footer">
        <span>© {new Date().getFullYear()} STYLO. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}

export default AdminHome;
