import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services";
import "./NotificationBell.css";

const NOTIFICATION_LABEL = {
    reserva_solicitada: "Nueva reserva",
    reserva_aceptada: "Reserva aceptada",
    reserva_cancelada: "Reserva cancelada",
    contrato_enviado: "Contrato enviado",
    contrato_revisado: "Revisión de contrato",
    contrato_firmado: "Contrato firmado",
    contrato_cancelado: "Evento cancelado",
    contrato_eliminado: "Contrato eliminado por el cliente",
    modificacion_solicitada: "Solicitud de modificación",
    modificacion_aprobada: "Modificación aprobada",
    modificacion_rechazada: "Modificación rechazada",
    modificacion_descartada: "Modificación descartada",
    pago_pendiente: "Pago pendiente",
    pago_recordatorio: "Recordatorio de pago",
    pago_confirmado: "Pago confirmado",
    pago_informado: "Pago informado",
    pago_rechazado: "Pago rechazado"
};

const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

function NotificationBell() {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const ref = useRef(null);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getAll();
            setNotifications(data.notifications || []);
            setUnread(data.unread || 0);
        } catch {
            // silencioso
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openBell = async () => {
        if (!open) {
            setOpen(true);
            setLoading(true);
            try {
                const data = await notificationService.getAll();
                setNotifications(data.notifications || []);
                setUnread(data.unread || 0);
            } catch {
                setNotifications([]);
            } finally {
                setLoading(false);
            }
            try {
                await notificationService.marcarTodas();
                setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
                setUnread(0);
            } catch {
                // silencioso
            }
        } else {
            setOpen(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const goTo = (notification) => {
        setOpen(false);

        const isAdmin = localStorage.getItem("sty_rol") === "administrador";

        if (notification.idContract) {
            navigate(`/contract/${notification.idContract}`);
            return;
        }

        if (
            notification.tipo === "reserva_solicitada" ||
            notification.tipo === "reserva_aceptada" ||
            notification.tipo === "reserva_cancelada"
        ) {
            navigate(isAdmin ? "/reservation" : "/my-reservations");
            return;
        }

        if (
            notification.tipo === "contrato_cancelado" ||
            notification.tipo === "contrato_eliminado"
        ) {
            navigate(isAdmin ? "/contract" : "/my-contracts");
        }
    };

    const handleDelete = async (event, notification) => {
        event.stopPropagation();
        try {
            await notificationService.eliminar(notification.idNotificacion);
            setNotifications((prev) =>
                prev.filter((n) => n.idNotificacion !== notification.idNotificacion)
            );
            if (!notification.leida) {
                setUnread((prev) => Math.max(0, prev - 1));
            }
        } catch {
            // silencioso
        }
    };

    return (
        <div className="bell-wrapper" ref={ref}>
            <button
                type="button"
                className="bell-button"
                onClick={openBell}
                aria-label="Notificaciones"
            >
                <IconBell />
                {unread > 0 && (
                    <span className="bell-badge">{unread > 99 ? "99+" : unread}</span>
                )}
            </button>

            {open && (
                <div className="bell-dropdown">
                    <div className="bell-dropdown-header">
                        <h3>Notificaciones</h3>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="bell-close"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="bell-list">
                        {loading ? (
                            <p className="bell-empty">Cargando...</p>
                        ) : notifications.length === 0 ? (
                            <p className="bell-empty">No tenés notificaciones.</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.idNotificacion}
                                    className={`bell-item ${n.leida ? "read" : "unread"}`}
                                >
                                    <button
                                        type="button"
                                        className="bell-item-main"
                                        onClick={() => goTo(n)}
                                    >
                                        <span className="bell-item-tag">
                                            {NOTIFICATION_LABEL[n.tipo] || "Notificación"}
                                        </span>
                                        <span className="bell-item-text">{n.mensaje}</span>
                                        <span className="bell-item-date">{formatDate(n.fecha)}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="bell-item-delete"
                                        onClick={(event) => handleDelete(event, n)}
                                        aria-label="Eliminar notificación"
                                        title="Eliminar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;