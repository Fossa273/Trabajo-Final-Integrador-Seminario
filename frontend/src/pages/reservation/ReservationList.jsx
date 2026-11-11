import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reservationService } from "../../services";
import "./ReservationList.css";
import FeedbackModal from "../../components/FeedbackModal.jsx";

const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconArrowLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const STATUS_OPTIONS = [
    { value: "todas", label: "Todas" },
    { value: "pendiente", label: "Pendientes" },
    { value: "aceptada", label: "Aceptadas" },
    { value: "confirmada", label: "Confirmadas" },
    { value: "cancelada", label: "Canceladas" }
];

function ReservationList() {

    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [statusFilter, setStatusFilter] = useState("pendiente");
    const [clientToDetail, setClientToDetail] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [reservationToCancelId, setReservationToCancelId] = useState(null);
    const [reservationToAcceptId, setReservationToAcceptId] = useState(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelMotivo, setCancelMotivo] = useState("");
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("sty_token");

    const showFeedback = (type, title, message) => {
        setFeedback({ type, title, message });
    };

    const getReservations = async () => {

        try {
            const data = await reservationService.getAll();

            setReservations(data);

        } catch (error) {
            console.error(error);
            showFeedback("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            showFeedback("error", "Error", "No estás autenticado. Volvé a iniciar sesión.");
            setLoading(false);
            return;
        }
        getReservations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredReservations = statusFilter === "todas"
        ? reservations
        : reservations.filter(r => r.status === statusFilter);

    const acceptReservation = async (id) => {

        setReservationToAcceptId(null);

        try {

            await reservationService.updateStatus(id, { status: "aceptada" });

            showFeedback(
                "success",
                "Reserva aceptada",
                "La reserva fue aceptada correctamente y se notificó al cliente."
            );

        } catch (error) {

            console.error(error);
            showFeedback("error", "Error", error.message);

        }
    };

    const handleCancelClick = (id) => {
        setReservationToCancelId(id);
        setCancelOpen(true);
    };

    const performCancel = async () => {

        if (!cancelMotivo.trim()) {
            showFeedback("error", "Falta el motivo", "Escribí el motivo de la eliminación para notificarlo al cliente.");
            return;
        }

        const id = reservationToCancelId;
        setReservationToCancelId(null);
        setCancelOpen(false);

        try {

            await reservationService.remove(id, { motivo: cancelMotivo.trim() });

            setCancelMotivo("");
            showFeedback("success", "Reserva cancelada", "Reserva cancelada correctamente. El cliente fue notificado.");

        } catch (error) {

            console.error(error);
            showFeedback("error", "Error", error.message);

        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("es-AR");
    };

    return (
        <div className="page-wrapper">

            <div className="client-dashboard table-list-dashboard">

                {/* Header */}
                <header className="dashboard-header-flex">

                    <div className="header-title-group">
                        <div className="header-icon">
                            <IconCalendar />
                        </div>
                        <div>
                            <h1>Gestión de Reservas</h1>
                            <p>Administrá las reservas del salón.</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn-back-panel"
                            onClick={() => navigate("/admin-home")}
                        >
                            <IconArrowLeft /> Volver al Panel
                        </button>
                        <div className="count-pill">
                            {filteredReservations.length}
                        </div>
                    </div>

                </header>

                {/* Filtros */}
                <div className="reservation-list-filters">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            className={`reservation-filter-btn ${statusFilter === opt.value ? "active" : ""}`}
                            onClick={() => setStatusFilter(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <div className="form-card full-width">

                    <div className="card-body-table">

                        {loading ? (
                            <p className="loading-text">Cargando reservas...</p>
                        ) : filteredReservations.length === 0 ? (
                            <p className="reservation-list-empty">
                                No hay reservas en este estado.
                            </p>
                        ) : (
                            <table className="reservation-list-table">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Fecha reserva</th>
                                        <th>Fecha evento</th>
                                        <th>Tipo de evento</th>
                                        <th>Estado</th>
                                        <th>Invitados</th>
                                        <th>Cliente</th>
                                        <th>Salón</th>
                                        <th>Tipo de salón</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredReservations.map((reservation) => (

                                        <tr key={reservation.idReservation}>

                                            <td>
                                                {reservation.idReservation}
                                            </td>

                                            <td>
                                                {formatDate(reservation.dateReservation)}
                                            </td>

                                            <td>
                                                {formatDate(reservation.dateEvent)}
                                            </td>

                                            <td>
                                                {reservation.eventType}
                                            </td>

                                            <td>
                                                <span className={`status-badge ${reservation.status}`}>
                                                    {reservation.statusLabel}
                                                </span>
                                            </td>

                                            <td>
                                                {reservation.maxCantInvit
                                                    ? `${reservation.cantInvit} - ${reservation.maxCantInvit}`
                                                    : reservation.cantInvit}
                                            </td>

                                            <td>
                                                {reservation.client?.nameCli}{" "}
                                                {reservation.client?.surnameCli}
                                            </td>

                                            <td>
                                                {reservation.lounge?.name}
                                            </td>

                                            <td>
                                                {reservation.loungeType?.nameLoungeType}
                                            </td>

                                            <td>

                                                <div className="actions-cell">

                                                    <button
                                                        type="button"
                                                        className="btn-action-view"
                                                        onClick={() =>
                                                            setClientToDetail(
                                                                reservation.client
                                                            )
                                                        }
                                                        title="Ver cliente"
                                                    >
                                                        <IconEye />
                                                    </button>

                                                    {reservation.status === "pendiente" && (
                                                        <button
                                                            className="reservation-btn-accept"
                                                            onClick={() =>
                                                                setReservationToAcceptId(
                                                                    reservation.idReservation
                                                                )
                                                            }
                                                        >
                                                            Aceptar
                                                        </button>
                                                    )}

                                                    {reservation.status === "pendiente" && (
                                                        <button
                                                            className="reservation-btn-cancel"
                                                            onClick={() =>
                                                                handleCancelClick(
                                                                    reservation.idReservation
                                                                )
                                                            }
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>
                        )}

                    </div>

                </div>

            </div>

            {clientToDetail && (
                <div className="modal-backdrop">
                    <div className="modal-card-form">
                        <div className="modal-header-styled">
                            <h2>Detalles del Cliente</h2>
                            <button
                                className="btn-close"
                                onClick={() => setClientToDetail(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-detail-grid">
                            <div className="detail-item">
                                <label>Nombre:</label>
                                <span>{clientToDetail.nameCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>Apellido:</label>
                                <span>{clientToDetail.surnameCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>DNI:</label>
                                <span>{clientToDetail.dniCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>Teléfono:</label>
                                <span>{clientToDetail.phoneCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>Email:</label>
                                <span>{clientToDetail.emailCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>Dirección:</label>
                                <span>{clientToDetail.addressCli}</span>
                            </div>
                            <div className="detail-item">
                                <label>Ciudad:</label>
                                <span>{clientToDetail.location?.city}</span>
                            </div>
                            <div className="detail-item">
                                <label>Código Postal:</label>
                                <span>{clientToDetail.location?.zipCode}</span>
                            </div>
                        </div>
                        <div className="modal-footer-right">
                            <button
                                className="btn-j-primary"
                                onClick={() => setClientToDetail(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reservationToAcceptId && (
                <div className="res-cancel-backdrop" onClick={() => setReservationToAcceptId(null)}>
                    <div className="res-cancel-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="res-cancel-close"
                            onClick={() => setReservationToAcceptId(null)}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                        <h3>¿Aceptar la reserva?</h3>
                        <p className="res-cancel-intro">
                            Estás por aceptar la reserva <strong>#{reservationToAcceptId}</strong>.
                            Al confirmar, la reserva pasará al estado <strong>Aceptada</strong>,
                            se generará el contrato y se notificará al cliente.
                        </p>
                        <p className="res-cancel-intro">
                            Si todavía no estás seguro, podés volver sin realizar cambios.
                        </p>
                        <div className="res-cancel-actions">
                            <button
                                className="btn-submit-cyan"
                                onClick={() => setReservationToAcceptId(null)}
                            >
                                Volver
                            </button>
                            <button
                                className="btn-j-primary"
                                onClick={() => acceptReservation(reservationToAcceptId)}
                            >
                                Sí, aceptar reserva
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cancelOpen && (
                <div className="res-cancel-backdrop" onClick={() => setCancelOpen(false)}>
                    <div className="res-cancel-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="res-cancel-close" onClick={() => setCancelOpen(false)} aria-label="Cerrar">✕</button>
                        <h3>Cancelar reserva</h3>
                        <p className="res-cancel-intro">
                            Esta acción da de baja la reserva y el evento. Indicá el
                            <strong> motivo</strong> de la eliminación: se lo notificaremos al cliente.
                        </p>
                        <textarea
                            className="res-cancel-textarea"
                            value={cancelMotivo}
                            onChange={(e) => setCancelMotivo(e.target.value)}
                            placeholder="Motivo de la eliminación..."
                            rows="4"
                        />
                        <div className="res-cancel-actions">
                            <button className="btn-submit-cyan" onClick={() => setCancelOpen(false)}>
                                Volver
                            </button>
                            <button
                                className="btn-j-danger"
                                onClick={performCancel}
                            >
                                Cancelar reserva
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {feedback && (
                <FeedbackModal
                    type={feedback.type}
                    title={feedback.title}
                    message={feedback.message}
                    confirmLabel={feedback.confirmLabel}
                    cancelLabel="Volver"
                    onConfirm={feedback.type === "confirm" ? performCancel : undefined}
                    onCancel={() => { setFeedback(null); setReservationToCancelId(null); }}
                    onClose={() => {
                        setFeedback(null);
                        if (feedback.type === "success" || feedback.type === "error") {
                            getReservations();
                        }
                    }}
                />
            )}

        </div>
    );
}

export default ReservationList;
