import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    contractService,
    loungeService,
    loungeTypeService,
    cardDetailService,
    extraServiceService,
    priceService,
    paymentService
} from "../../services";
import FeedbackModal from "../../components/FeedbackModal";
import "./ContractDetail.css";

const IconContract = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

function ContractDetail() {

    const navigate = useNavigate();
    const { id } = useParams();

    const [contract, setContract] = useState(null);
    const [mountData, setMountData] = useState({
        lounges: [],
        loungeTypes: [],
        cardDetails: [],
        extraServices: []
    });

    const [form, setForm] = useState({
        dateEvent: "",
        eventType: "",
        idCardDetail: "",
        idServices: [],
        cantExactaInvit: "",
        eventStartTime: "",
        eventEndTime: ""
    });

    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modificando, setModificando] = useState(false);
    const [commentMod, setCommentMod] = useState("");
    const [showTerminos, setShowTerminos] = useState(false);
    const [confirmFirma, setConfirmFirma] = useState(false);
    const [confirmCancelar, setConfirmCancelar] = useState(false);
    const [confirmEliminar, setConfirmEliminar] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectMotivo, setRejectMotivo] = useState("");
    const [adminDate, setAdminDate] = useState("");
    const [confirmCambioFecha, setConfirmCambioFecha] = useState(false);
    const [motivoCambioFecha, setMotivoCambioFecha] = useState("");
    const [confirmAceptarCambio, setConfirmAceptarCambio] = useState(false);
    const [confirmCancelarCambio, setConfirmCancelarCambio] = useState(false);
    const [motivoCancelarCambio, setMotivoCancelarCambio] = useState("");
    const [pendingRedirect, setPendingRedirect] = useState(false);
    const [activePrice, setActivePrice] = useState(null);
    const [reportingPayment, setReportingPayment] = useState(null);
    const [reportProof, setReportProof] = useState(null);
    const [reportForm, setReportForm] = useState({
        reportedPaymentDate: new Date().toISOString().split("T")[0],
        reportedMethod: "Transferencia",
        reportedReference: "",
        reportedNotes: ""
    });

    const rol = localStorage.getItem("sty_rol");

    const EVENT_TYPES = [
        "Casamiento",
        "Cumpleaños",
        "Cumpleaños +40",
        "Fiesta de 15",
        "Empresa / Corporativo",
        "Otro"
    ];

    const PAYMENT_STATUS_LABEL = {
        pendiente: "Pendiente",
        "seña": "Seña abonada",
        pagado: "Pagado"
    };

    const REPORT_STATUS_LABEL = {
        pendiente: "Pago informado",
        confirmado: "Confirmado",
        rechazado: "Rechazado"
    };

    const canEdit = contract?.canBeEdited ?? false;
    const tieneModPendiente = contract?.hasPendingModification ?? false;
    const tieneModRechazada =
        rol === "cliente" &&
        contract?.status === "firmado" &&
        contract?.modificationStatus === "rechazada";

    const puedeEditar = canEdit && rol === "cliente";

    const esCambioFechaAdmin =
        contract?.modificationData?.origin === "administrador";
    const tieneCambioFechaAdminPendiente =
        rol === "cliente" &&
        contract?.status === "en_revision" &&
        tieneModPendiente &&
        esCambioFechaAdmin;
    const puedeCambiarFechaAdmin =
        rol === "administrador" &&
        ["generado", "aprobado", "firmado"].includes(contract?.status) &&
        !contract?.modificationStatus &&
        !esCambioFechaAdmin;

    const showMessage = (type, title, text) => {
        setMessage({ type, title, text });
    };

    const closeMessage = () => {
        setMessage(null);
        if (pendingRedirect) {
            setPendingRedirect(false);
            navigate("/client-home");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const dateOnly = String(dateStr).split("T")[0];
        const [year, month, day] = dateOnly.split("-");
        if (!year || !month || !day) return dateOnly;
        return `${day}/${month}/${year}`;
    };

    const formatTime = (t) => {
        if (!t) return "";
        if (typeof t === "string" && !t.includes("T")) return t;
        const d = new Date(t);
        if (Number.isNaN(d.getTime())) return "";
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mm = String(d.getUTCMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    };

    const currency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS"
        }).format(Number(value) || 0);
    };

    useEffect(() => {
        const getCatalog = async () => {
            try {
                const [lounges, loungeTypes, cardDetails, extraServices] =
                    await Promise.all([
                        loungeService.getAll(),
                        loungeTypeService.getAll(),
                        cardDetailService.getAll(),
                        extraServiceService.getAll()
                    ]);
                setMountData({
                    lounges,
                    loungeTypes,
                    cardDetails,
                    extraServices
                });
            } catch (error) {
                console.error("Error al obtener el catálogo:", error);
            }
        };
        getCatalog();
    }, []);

    useEffect(() => {
        const getContract = async () => {
            try {
                const data = await contractService.getById(id);

                setContract(data);

                setAdminDate(
                    data.reservation?.dateEvent
                        ? data.reservation.dateEvent.split("T")[0]
                        : ""
                );

                setForm({
                    dateEvent: data.reservation?.dateEvent
                        ? data.reservation.dateEvent.split("T")[0]
                        : "",
                    eventType: data.reservation?.eventType || "",
                    idCardDetail: data.reservation?.idCardDetail
                        ? String(data.reservation.idCardDetail)
                        : "",
                    idServices:
                        (data.extraServices || []).map(
                            (s) => s.idService
                        ) || [],
                    cantExactaInvit:
                        data.cantExactaInvit !== null &&
                            data.cantExactaInvit !== undefined
                            ? String(data.cantExactaInvit)
                            : "",
                    eventStartTime: formatTime(data.eventStartTime),
                    eventEndTime: formatTime(data.eventEndTime)
                });

            } catch (error) {
                showMessage("error", "Error", error.message);
            } finally {
                setLoading(false);
            }
        };
        getContract();
    }, [id]);

    useEffect(() => {
        const idLoungeType = contract?.reservation?.idLoungeType;
        const dateEvent = form.dateEvent ||
            (contract?.reservation?.dateEvent
                ? contract.reservation.dateEvent.split("T")[0]
                : "");

        if (!idLoungeType || !dateEvent) return;

        let cancelled = false;

        priceService.getActivo(idLoungeType, dateEvent)
            .then((data) => {
                if (!cancelled) setActivePrice(data);
            })
            .catch(() => {
                if (!cancelled) setActivePrice(null);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract?.reservation?.idLoungeType, form.dateEvent]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleServiceChange = (idService) => {
        let updated = [...form.idServices];
        if (updated.includes(idService)) {
            updated = updated.filter((sid) => sid !== idService);
        } else {
            updated.push(idService);
        }
        setForm({ ...form, idServices: updated });
    };

    const handleSave = async () => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.update(id, {
                dateEvent: form.dateEvent,
                eventType: form.eventType,
                idCardDetail: form.idCardDetail
                    ? Number(form.idCardDetail)
                    : null,
                idServices: form.idServices,
                cantExactaInvit: form.cantExactaInvit
                    ? Number(form.cantExactaInvit)
                    : null,
                eventStartTime: form.eventStartTime || null,
                eventEndTime: form.eventEndTime || null
            });

            setContract(data.contract);
            setForm((prev) => ({
                ...prev,
                cantExactaInvit:
                    data.contract.cantExactaInvit !== null &&
                        data.contract.cantExactaInvit !== undefined
                        ? String(data.contract.cantExactaInvit)
                        : "",
                eventStartTime: formatTime(data.contract.eventStartTime),
                eventEndTime: formatTime(data.contract.eventEndTime)
            }));

            showMessage("success", "Contrato guardado", "Los cambios se guardaron correctamente.");
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEnviar = async () => {
        setMessage(null);
        setSaving(true);

        try {
            await contractService.update(id, {
                dateEvent: form.dateEvent,
                eventType: form.eventType,
                idCardDetail: form.idCardDetail
                    ? Number(form.idCardDetail)
                    : null,
                idServices: form.idServices,
                cantExactaInvit: form.cantExactaInvit
                    ? Number(form.cantExactaInvit)
                    : null,
                eventStartTime: form.eventStartTime || null,
                eventEndTime: form.eventEndTime || null
            });

            const data = await contractService.enviar(id);

            setContract(data.contract);
            navigate("/client-home");
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSolicitarMod = async () => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.solicitarModificacion(id, {
                dateEvent: form.dateEvent,
                eventType: form.eventType,
                idCardDetail: form.idCardDetail
                    ? Number(form.idCardDetail)
                    : null,
                idServices: form.idServices,
                cantExactaInvit: form.cantExactaInvit
                    ? Number(form.cantExactaInvit)
                    : null,
                eventStartTime: form.eventStartTime || null,
                eventEndTime: form.eventEndTime || null,
                comment: commentMod || null
            });

            setContract(data.contract);
            setModificando(false);
            setCommentMod("");
            showMessage("success", "Modificación solicitada", "Tu solicitud quedó pendiente de aprobación por el administrador.");
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRevisarMod = async (decision, motivo) => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.revisarModificacion(
                id,
                decision === "rechazar" ? { decision, motivo } : { decision }
            );

            setContract(data.contract);
            showMessage(
                "success",
                decision === "aprobar" ? "Modificación aprobada" : "Modificación rechazada",
                data.message
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmRechazo = () => {
        if (!rejectMotivo.trim()) {
            showMessage("error", "Falta el motivo", "Escribí el motivo del rechazo para notificar al cliente.");
            return;
        }

        setRejectOpen(false);
        handleRevisarMod("rechazar", rejectMotivo.trim());
        setRejectMotivo("");
    };

    const handleContinuarContrato = async () => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.resolverModificacion(id, { decision: "continuar" });

            setContract(data.contract);
            showMessage("success", "Contrato vigente", "Continuás con el contrato como estaba.");
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelarEvento = async () => {
        setConfirmCancelar(false);
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.resolverModificacion(id, { decision: "cancelar" });

            setPendingRedirect(true);
            showMessage("success", "Evento cancelado", data.message);
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarContrato = async () => {
        setMessage(null);
        setSaving(true);

        try {
            await contractService.eliminarCliente(id);

            setPendingRedirect(true);
            showMessage(
                "success",
                "Contrato eliminado",
                "El contrato fue eliminado y el evento quedó dado de baja. No se realizan reembolsos del dinero pagado."
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSolicitarCambioFecha = async () => {
        setMessage(null);

        if (!adminDate) {
            showMessage("error", "Falta la fecha", "Seleccioná la nueva fecha del evento.");
            return;
        }

        const fechaActual = contract.reservation?.dateEvent
            ? contract.reservation.dateEvent.split("T")[0]
            : "";

        if (adminDate === fechaActual) {
            showMessage("error", "Fecha sin cambios", "La nueva fecha debe ser distinta de la actual.");
            return;
        }

        if (!motivoCambioFecha.trim()) {
            showMessage("error", "Falta el motivo", "Escribí el motivo del cambio de fecha para notificar al cliente.");
            return;
        }

        setSaving(true);

        try {
            const data = await contractService.solicitarCambioFecha(id, {
                dateEvent: adminDate,
                motivo: motivoCambioFecha.trim()
            });

            setContract(data.contract);
            setConfirmCambioFecha(false);
            setMotivoCambioFecha("");
            showMessage(
                "success",
                "Cambio de fecha propuesto",
                "El contrato quedó en revisión hasta que el cliente acepte el cambio o cancele el evento. Se notificó al cliente."
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAceptarCambioFecha = async () => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.aceptarCambioFecha(id);

            setContract(data.contract);
            setConfirmAceptarCambio(false);
            const nuevaFecha = data.contract.reservation?.dateEvent
                ? data.contract.reservation.dateEvent.split("T")[0]
                : "";
            setAdminDate(nuevaFecha);
            setForm((prev) => ({ ...prev, dateEvent: nuevaFecha }));
            showMessage(
                "success",
                "Cambio de fecha aceptado",
                "El evento quedó programado para la nueva fecha y se notificó al administrador."
            );
        } catch (error) {
            setConfirmAceptarCambio(false);
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelarCambioFecha = async () => {
        setMessage(null);

        if (!motivoCancelarCambio.trim()) {
            showMessage("error", "Falta el motivo", "Escribí el motivo de la cancelación del evento.");
            return;
        }

        setSaving(true);

        try {
            await contractService.cancelarCambioFecha(id, {
                motivo: motivoCancelarCambio.trim()
            });

            setConfirmCancelarCambio(false);
            setPendingRedirect(true);
            showMessage(
                "success",
                "Evento cancelado",
                "Rechazaste el cambio de fecha y el evento fue cancelado. Se notificó al administrador."
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCambiarPago = async (payment, statusPayment) => {
        if (!payment) return;
        setMessage(null);
        setSaving(true);

        try {
            await paymentService.update(payment.idPayment, { statusPayment });

            const refreshed = await contractService.getById(id);
            setContract(refreshed);

            const concept = payment.concept || "Cuota";

            if (statusPayment === "pagado") {
                showMessage(
                    "success",
                    "Pago confirmado",
                    `La cuota "${concept}" fue marcada como pagada.`
                );
            } else if (statusPayment === "seña") {
                showMessage(
                    "success",
                    "Seña registrada",
                    `La cuota "${concept}" quedó registrada como seña abonada.`
                );
            } else {
                showMessage(
                    "success",
                    "Pago reabierto",
                    `La cuota "${concept}" volvió a estado pendiente.`
                );
            }
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRecordarPago = async (payment) => {
        if (!payment) return;
        setMessage(null);
        setSaving(true);

        try {
            await paymentService.sendReminder(payment.idPayment);

            const refreshed = await contractService.getById(id);
            setContract(refreshed);

            showMessage(
                "success",
                "Recordatorio enviado",
                "Se notificó al cliente por la campana y por correo."
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const openReportModal = (payment) => {
        setReportingPayment(payment);
        setReportProof(null);
        setReportForm({
            reportedPaymentDate: new Date().toISOString().split("T")[0],
            reportedMethod: "Transferencia",
            reportedReference: "",
            reportedNotes: ""
        });
    };

    const handleReportChange = (event) => {
        const { name, value } = event.target;
        setReportForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleReportSubmit = async (event) => {
        event.preventDefault();
        if (!reportingPayment) return;
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("reportedPaymentDate", reportForm.reportedPaymentDate);
            formData.append("reportedMethod", reportForm.reportedMethod);
            formData.append("reportedReference", reportForm.reportedReference);
            formData.append("reportedNotes", reportForm.reportedNotes);

            if (reportProof) {
                formData.append("proof", reportProof);
            }

            await paymentService.report(reportingPayment.idPayment, formData);

            const refreshed = await contractService.getById(id);
            setContract(refreshed);
            setReportingPayment(null);
            setReportProof(null);

            showMessage(
                "success",
                "Pago informado",
                "Tu aviso quedó pendiente de confirmación por el administrador."
            );
        } catch (error) {
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAceptar = async () => {
        setMessage(null);
        setSaving(true);

        try {
            const data = await contractService.aceptar(id);

            setContract(data.contract);
            setConfirmFirma(false);
            setPendingRedirect(true);
            showMessage(
                "success",
                "Contrato firmado",
                "El contrato fue firmado correctamente y se notificó al administrador."
            );
        } catch (error) {
            setConfirmFirma(false);
            showMessage("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="client-dashboard contract-detail-dashboard">
                    <p className="contract-detail-message">Cargando contrato...</p>
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="page-wrapper">
                <div className="client-dashboard contract-detail-dashboard">
                    <p className="contract-detail-message">No se encontró el contrato.</p>
                    <div className="header-actions">
                        <button className="btn-back-panel" onClick={() => navigate(rol === "administrador" ? "/contract" : "/my-contracts")}>
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const reservation = contract.reservation;

    const payments = Array.isArray(contract.payments) ? contract.payments : [];
    const totalPagado = payments
        .filter((payment) => ["seña", "pagado"].includes(payment.statusPayment))
        .reduce((acc, payment) => acc + (Number(payment.value) || 0), 0);
    const totalPendiente = payments
        .filter((payment) => payment.statusPayment === "pendiente")
        .reduce((acc, payment) => acc + (Number(payment.value) || 0), 0);

    const fecEvento = form.dateEvent ||
        (reservation?.dateEvent ? reservation.dateEvent.split("T")[0] : "");

    const diasHastaEvento = (() => {
        if (!fecEvento) return null;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const evento = new Date(`${fecEvento}T00:00:00`);
        return Math.round((evento.getTime() - hoy.getTime()) / 86400000);
    })();

    const puedeSolicitarMod =
        rol === "cliente" &&
        contract.status === "firmado" &&
        !tieneModPendiente &&
        !tieneModRechazada &&
        diasHastaEvento !== null &&
        diasHastaEvento >= 14;

    const cantExactaVal =
        form.cantExactaInvit === "" ||
        form.cantExactaInvit === undefined ||
        form.cantExactaInvit === null
            ? null
            : Number(form.cantExactaInvit);

    const menuActual = mountData.cardDetails.find(
        (m) => String(m.idCardDetail) === String(form.idCardDetail)
    );
    const menuStage = menuActual?.menuStage || reservation?.cardDetail?.menuStage || "—";

    const calcLive = (() => {
        const priceSalon = activePrice ? Number(activePrice.value) : 0;
        const menuBudget = menuActual ? Number(menuActual.budget) : 0;
        const menuValue = cantExactaVal ? menuBudget * cantExactaVal : 0;
        const totalExtras = (form.idServices || []).reduce((acc, sid) => {
            const svc = mountData.extraServices.find(
                (s) => s.idService === Number(sid)
            );
            return acc + (svc ? Number(svc.cost) : 0);
        }, 0);
        const total = Math.round((priceSalon + menuValue + totalExtras) * 100) / 100;
        return {
            priceSalon,
            menuValue,
            totalExtras,
            total,
            hasPrice: Boolean(activePrice),
            menuBudget
        };
    })();

    const modMenu = mountData.cardDetails.find(
        (m) => String(m.idCardDetail) === String(contract.modificationData?.idCardDetail)
    );
    const modExtras = (contract.modificationData?.idServices || []).map(
        (sid) => mountData.extraServices.find((s) => s.idService === Number(sid))?.nameService
    ).filter(Boolean);

    const modDiffs = (() => {
        const d = contract.modificationData || {};
        const res = reservation || {};
        const diffs = [];

        const curDate = res.dateEvent ? res.dateEvent.split("T")[0] : "";
        const newDate = d.dateEvent ? d.dateEvent.split("T")[0] : "";
        if (newDate && newDate !== curDate) {
            diffs.push({
                campo: "Fecha del evento",
                actual: formatDate(curDate) || "—",
                nuevo: formatDate(newDate)
            });
        }

        if (d.eventType && d.eventType !== res.eventType) {
            diffs.push({
                campo: "Tipo de evento",
                actual: res.eventType || "—",
                nuevo: d.eventType
            });
        }

        if (d.cantExactaInvit != null && Number(d.cantExactaInvit) !== Number(contract.cantExactaInvit)) {
            diffs.push({
                campo: "Cantidad de invitados",
                actual: contract.cantExactaInvit ?? "—",
                nuevo: `${d.cantExactaInvit} invitados`
            });
        }

        if (d.eventStartTime && formatTime(d.eventStartTime) !== formatTime(contract.eventStartTime)) {
            diffs.push({
                campo: "Hora de inicio",
                actual: formatTime(contract.eventStartTime) || "—",
                nuevo: formatTime(d.eventStartTime)
            });
        }

        if (d.eventEndTime && formatTime(d.eventEndTime) !== formatTime(contract.eventEndTime)) {
            diffs.push({
                campo: "Hora de fin",
                actual: formatTime(contract.eventEndTime) || "—",
                nuevo: formatTime(d.eventEndTime)
            });
        }

        if (d.idCardDetail != null && String(d.idCardDetail) !== String(res.idCardDetail)) {
            diffs.push({
                campo: "Menú",
                actual: res.cardDetail?.menuStage || "—",
                nuevo: modMenu ? `${modMenu.menuStage} — ${modMenu.detail}` : "—"
            });
        }

        const curIds = (contract.extraServices || [])
            .map((s) => Number(s.idService))
            .sort((a, b) => a - b);
        const newIds = Array.isArray(d.idServices)
            ? d.idServices.map((s) => Number(s)).sort((a, b) => a - b)
            : null;

        if (newIds && newIds.join(",") !== curIds.join(",")) {
            diffs.push({
                campo: "Servicios extras",
                actual: curIds.length > 0
                    ? (contract.extraServices || []).map((s) => s.nameService).join(", ")
                    : "Ninguno",
                nuevo: modExtras.length > 0 ? modExtras.join(", ") : "Ninguno"
            });
        }

        return diffs;
    })();

    const modAppliedList = (() => {
        const d = contract.modificationData || {};
        const applied = [];

        if (d.dateEvent) {
            applied.push({ campo: "Fecha del evento", valor: formatDate(d.dateEvent) });
        }
        if (d.eventType) {
            applied.push({ campo: "Tipo de evento", valor: d.eventType });
        }
        if (d.cantExactaInvit != null) {
            applied.push({ campo: "Cantidad exacta de invitados", valor: `${d.cantExactaInvit} invitados` });
        }
        if (d.eventStartTime) {
            applied.push({ campo: "Hora de inicio", valor: formatTime(d.eventStartTime) });
        }
        if (d.eventEndTime) {
            applied.push({ campo: "Hora de fin", valor: formatTime(d.eventEndTime) });
        }
        if (d.idCardDetail != null) {
            applied.push({
                campo: "Menú",
                valor: modMenu ? `${modMenu.menuStage} — ${modMenu.detail}` : "—"
            });
        }
        if (Array.isArray(d.idServices)) {
            applied.push({
                campo: "Servicios extras",
                valor: modExtras.length > 0 ? modExtras.join(", ") : "Ninguno"
            });
        }

        return applied;
    })();

    const modNuevos = modDiffs.map((diff) => ({
        campo: diff.campo,
        valor: diff.nuevo
    }));

    return (
        <div className="page-wrapper">

            <div className="client-dashboard contract-detail-dashboard">

            <header className="dashboard-header-flex">
                <div className="header-title-group">
                    <div className="header-icon">
                        <IconContract />
                    </div>
                    <div>
                        <h1>Contrato #{contract.idContract}</h1>
                        <span className={`contract-status ${contract.status}`}>
                            {contract.statusDescription}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-back-panel" onClick={() => navigate(rol === "administrador" ? "/contract" : "/my-contracts")}>
                        Volver
                    </button>
                </div>
            </header>

            <main className="contract-detail-content">

                {/* PARTES */}
                <section className="contract-section">
                    <h2>Partes</h2>
                    <div className="contract-parties">
                        <div className="contract-party">
                            <h3>SALON STYLO</h3>
                            <p>{reservation.lounge?.name}</p>
                            <p>{reservation.lounge?.loungeAddress}</p>
                        </div>
                        <div className="contract-party">
                            <h3>CLIENTE</h3>
                            <p>{reservation.client?.nameCli} {reservation.client?.surnameCli}</p>
                            <p>DNI: {reservation.client?.dniCli}</p>
                            <p>{reservation.client?.addressCli}, {reservation.client?.location?.city}</p>
                            <p>{reservation.client?.phoneCli} · {reservation.client?.emailCli}</p>
                        </div>
                    </div>
                </section>

                {/* DATOS DEL EVENTO (editables) */}
                <section className="contract-section">
                    <h2>Datos del evento</h2>
                    <div className="contract-fields">
                        <div className="contract-field">
                            <label>Fecha del evento</label>
                            {puedeEditar ? (
                                <input type="date" name="dateEvent" value={form.dateEvent} onChange={handleChange} />
                            ) : (
                                <span>{formatDate(reservation.dateEvent)}</span>
                            )}
                        </div>

                        <div className="contract-field">
                            <label>Tipo de evento</label>
                            {puedeEditar ? (
                                <select name="eventType" value={form.eventType} onChange={handleChange}>
                                    <option value="" disabled>Seleccioná el tipo de evento...</option>
                                    {EVENT_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            ) : (
                                <span>{reservation.eventType}</span>
                            )}
                        </div>

                        <div className="contract-field">
                            <label>Salón</label>
                            <span>{reservation.lounge?.name} — {reservation.loungeType?.nameLoungeType}</span>
                        </div>

                        <div className="contract-field">
                            <label>Cantidades prestablecidas</label>
                            <span>{reservation.cantInvit} - {reservation.maxCantInvit} invitados</span>
                        </div>
                    </div>
                </section>

                {/* CAMBIO DE FECHA (admin) */}
                {puedeCambiarFechaAdmin && (
                    <section className="contract-section contract-mod-revision">
                        <h2>Cambio de fecha del evento</h2>
                        <div className="contract-mod-alert">
                            <strong>REPROGRAMAR EVENTO</strong>
                            <span>
                                Podés proponer una nueva fecha para el evento. El cliente deberá
                                aceptarla o cancelar el evento. Mientras tanto, el contrato quedará
                                en revisión y se le enviará una notificación con el motivo.
                            </span>
                        </div>
                        <div className="contract-fields">
                            <div className="contract-field">
                                <label>Fecha actual</label>
                                <span>{formatDate(reservation.dateEvent)}</span>
                            </div>
                            <div className="contract-field">
                                <label>Nueva fecha</label>
                                <input
                                    type="date"
                                    value={adminDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setAdminDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="contract-actions">
                            <button
                                className="contract-btn-save"
                                onClick={() => setConfirmCambioFecha(true)}
                                disabled={saving}
                            >
                                Guardar cambios
                            </button>
                        </div>
                    </section>
                )}

                {/* CANTIDAD EXACTA + HORARIOS */}
                <section className="contract-section">
                    <h2>Cantidad de invitados y horario</h2>
                    <div className="contract-fields">
                        <div className="contract-field">
                            <label>Cantidad exacta de invitados</label>
                            {puedeEditar ? (
                                <input
                                    type="number"
                                    name="cantExactaInvit"
                                    value={form.cantExactaInvit}
                                    onChange={handleChange}
                                    min={reservation.cantInvit}
                                    max={reservation.maxCantInvit}
                                    placeholder={`${reservation.cantInvit} - ${reservation.maxCantInvit}`}
                                />
                            ) : (
                                <span>{contract.cantExactaInvit ?? "—"}</span>
                            )}
                            <small>Debe estar entre {reservation.cantInvit} y {reservation.maxCantInvit} invitados.</small>
                        </div>

                        <div className="contract-field">
                            <label>Hora de inicio del evento</label>
                            {puedeEditar ? (
                                <input type="time" name="eventStartTime" value={form.eventStartTime} onChange={handleChange} />
                            ) : (
                                <span>{formatTime(contract.eventStartTime) || "—"}</span>
                            )}
                        </div>

                        <div className="contract-field">
                            <label>Hora de fin del evento</label>
                            {puedeEditar ? (
                                <input type="time" name="eventEndTime" value={form.eventEndTime} onChange={handleChange} />
                            ) : (
                                <span>{formatTime(contract.eventEndTime) || "—"}</span>
                            )}
                        </div>
                    </div>
                </section>

                {/* MENÚ Y EXTRAS */}
                <section className="contract-section">
                    <h2>Menú y servicios</h2>

                    <div className="contract-field">
                        <label>Menú</label>
                        {puedeEditar ? (
                            mountData.cardDetails.map((menu) => (
                                <label className="contract-option" key={menu.idCardDetail}>
                                    <input
                                        type="radio"
                                        name="idCardDetail"
                                        value={menu.idCardDetail}
                                        checked={form.idCardDetail === String(menu.idCardDetail)}
                                        onChange={handleChange}
                                    />
                                    <span><strong>{menu.menuStage}</strong> — {menu.detail} ({currency(menu.budget)} por persona)</span>
                                </label>
                            ))
                        ) : (
                            <span>{reservation.cardDetail?.menuStage || "Sin menú"}</span>
                        )}
                    </div>

                    <div className="contract-field">
                        <label>Servicios extras</label>
                        {puedeEditar ? (
                            mountData.extraServices.map((service) => (
                                <label className="contract-option" key={service.idService}>
                                    <input
                                        type="checkbox"
                                        checked={form.idServices.includes(service.idService)}
                                        onChange={() => handleServiceChange(service.idService)}
                                    />
                                    <span><strong>{service.nameService}</strong> — {service.detailService} ({currency(service.cost)})</span>
                                </label>
                            ))
                        ) : (
                            <span>
                                {contract.extraServices && contract.extraServices.length > 0
                                    ? contract.extraServices.map((s) => s.nameService).join(", ")
                                    : "Ninguno"}
                            </span>
                        )}
                    </div>
                </section>

                {/* CLAUSULAS TECNICAS */}
                <section className="contract-section">
                    <h2>Cláusulas del contrato</h2>
                    {(contract.clausulas?.clausulas || []).map((clause) => (
                        <div className="contract-clause" key={clause.title}>
                            <h3>{clause.title}</h3>
                            <p>{clause.text}</p>
                        </div>
                    ))}
                    <p className="contract-legal-note">
                        Estas cláusulas son de carácter técnico y no pueden ser modificadas.
                    </p>
                </section>

                {/* DESGLOSE */}
                <section className="contract-section">
                    <h2>Desglose de precios</h2>
                    <table className="contract-price-table">
                        <tbody>
                            <tr>
                                <td>Salón (fecha {formatDate(reservation.dateEvent)})</td>
                                <td>{currency(calcLive.priceSalon)}</td>
                            </tr>
                            <tr className={!cantExactaVal ? "contract-row-muted" : ""}>
                                <td>Menú ({menuStage} × {cantExactaVal ?? "—"} invitados)</td>
                                <td>{cantExactaVal ? currency(calcLive.menuValue) : "—"}</td>
                            </tr>
                            <tr>
                                <td>Servicios extras</td>
                                <td>{currency(calcLive.totalExtras)}</td>
                            </tr>
                            {cantExactaVal ? (
                                <tr className="contract-price-total">
                                    <td>Valor final</td>
                                    <td>{currency(calcLive.total)}</td>
                                </tr>
                            ) : (
                                <tr className="contract-price-novalue">
                                    <td colSpan="2">Ingresá la cantidad exacta de invitados para ver el valor final del contrato.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {!calcLive.hasPrice && (
                        <small className="contract-warning">
                            No hay un precio de salón vigente cargado, por lo que se consideró $0 para el salón. Contactá al administrador.
                        </small>
                    )}
                </section>

                {(rol === "administrador" || rol === "cliente") && (
                    <section className="contract-section">
                        <h2>Pagos del contrato</h2>

                        <div className="contract-payment-summary">
                            <div>
                                <span>Valor final</span>
                                <strong>{currency(contract.finalValue)}</strong>
                            </div>
                            <div>
                                <span>Abonado</span>
                                <strong className="paid">{currency(totalPagado)}</strong>
                            </div>
                            <div>
                                <span>Saldo pendiente</span>
                                <strong className="pending">{currency(totalPendiente)}</strong>
                            </div>
                        </div>

                        {payments.length > 0 ? (
                            <div className="contract-payment-table-wrap">
                                <table className="contract-payment-table">
                                    <thead>
                                        <tr>
                                            <th>Concepto</th>
                                            <th>Monto</th>
                                            <th>Vencimiento</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: "center" }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.idPayment}>
                                                <td>{payment.concept || "Cuota"}</td>
                                                <td>{currency(payment.value)}</td>
                                                <td>{formatDate(payment.dueDate)}</td>
                                                <td>
                                                    <div className="contract-payment-status-stack">
                                                        <span className={`contract-status ${payment.statusPayment}`}>
                                                            {PAYMENT_STATUS_LABEL[payment.statusPayment] || payment.statusPayment}
                                                        </span>
                                                        {payment.reportStatus && (
                                                            <span className={`contract-report-status ${payment.reportStatus}`}>
                                                                {REPORT_STATUS_LABEL[payment.reportStatus] || payment.reportStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="contract-payment-actions">
                                                        {rol === "administrador" ? (
                                                            payment.statusPayment === "pendiente" ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="contract-payment-btn paid"
                                                                        onClick={() => handleCambiarPago(payment, "pagado")}
                                                                        disabled={saving}
                                                                    >
                                                                        Marcar abonado
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="contract-payment-btn reminder"
                                                                        onClick={() => handleRecordarPago(payment)}
                                                                        disabled={saving || payment.reportStatus === "pendiente"}
                                                                    >
                                                                        Recordar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="contract-payment-btn reopen"
                                                                    onClick={() => handleCambiarPago(payment, "pendiente")}
                                                                    disabled={saving}
                                                                >
                                                                    Reabrir
                                                                </button>
                                                            )
                                                        ) : payment.reportStatus === "pendiente" ? (
                                                            <span className="contract-payment-hint">
                                                                Esperando confirmación
                                                            </span>
                                                        ) : payment.statusPayment === "pendiente" ? (
                                                            <button
                                                                type="button"
                                                                className="contract-payment-btn report"
                                                                onClick={() => openReportModal(payment)}
                                                                disabled={saving}
                                                            >
                                                                {payment.reportStatus === "rechazado"
                                                                    ? "Volver a informar"
                                                                    : "Informar pago"}
                                                            </button>
                                                        ) : (
                                                            <span className="contract-payment-hint">
                                                                Sin acciones pendientes
                                                            </span>
                                                        )}
                                                    </div>
                                                    {rol === "cliente" &&
                                                        payment.reportStatus === "rechazado" &&
                                                        payment.reportReviewNotes && (
                                                            <p className="contract-payment-reject-note">
                                                                Motivo: {payment.reportReviewNotes}
                                                            </p>
                                                        )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="contract-mod-meta">
                                Este contrato no tiene pagos registrados.
                            </p>
                        )}

                        {rol === "administrador" && (
                            <div className="contract-actions contract-payment-footer">
                                <button
                                    type="button"
                                    className="contract-btn-primary"
                                    onClick={() => navigate("/payment")}
                                    disabled={saving}
                                >
                                    Gestionar pagos
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* MODIFICACION APROBADA — PENDIENTE DE FIRMA (cliente) */}
                {rol === "cliente" &&
                    contract.status === "aprobado" &&
                    contract.modificationStatus === "aprobada" && (
                        <section className="contract-section contract-mod-solicitando">
                            <div className="contract-mod-alert">
                                <strong>MODIFICACIÓN APROBADA — PENDIENTE DE TU FIRMA</strong>
                                <span>
                                    El administrador aprobó tu modificación el {formatDate(contract.modificationReviewedAt)}.
                                    Los cambios ya fueron aplicados. Revisá los datos y firmá el contrato nuevamente.
                                </span>
                            </div>
                            <p className="contract-mod-meta">
                                Solicitud del {formatDate(contract.modificationRequestedAt)}.
                            </p>
                            {modAppliedList.length > 0 ? (
                                <div className="contract-mod-diff">
                                    {modAppliedList.map((app, i) => (
                                        <div className="contract-mod-diff-row" key={i}>
                                            <div className="contract-mod-diff-campo">{app.campo}</div>
                                            <div className="contract-mod-diff-val nuevo contract-mod-diff-val-full">{app.valor}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="contract-mod-meta">Modificación sin cambios de datos, solo comentario.</p>
                            )}
                            {!!contract.modificationComment && (
                                <div className="contract-mod-comment">
                                    <strong>Comentario que dejaste:</strong>
                                    <p>{contract.modificationComment}</p>
                                </div>
                            )}
                        </section>
                    )}

                {/* CAMBIO DE FECHA PROPUESTO POR EL ADMINISTRADOR (cliente) */}
                {tieneCambioFechaAdminPendiente && (
                    <section className="contract-section contract-mod-solicitando">
                        <div className="contract-mod-alert">
                            <strong>CAMBIO DE FECHA PROPUESTO POR EL ADMINISTRADOR</strong>
                            <span>
                                El administrador propone reprogramar tu evento. Revisá la nueva
                                fecha y elegí si aceptás el cambio o si preferís cancelar el evento.
                            </span>
                        </div>
                        <div className="contract-mod-diff">
                            {modDiffs.map((diff, i) => (
                                <div className="contract-mod-diff-row" key={i}>
                                    <div className="contract-mod-diff-campo">{diff.campo}</div>
                                    <div className="contract-mod-diff-val actual">{diff.actual}</div>
                                    <div className="contract-mod-diff-arrow">→</div>
                                    <div className="contract-mod-diff-val nuevo">{diff.nuevo}</div>
                                </div>
                            ))}
                        </div>
                        <div className="contract-mod-comment">
                            <strong>Motivo del cambio:</strong>
                            <p>{contract.modificationComment || "Sin motivo informado."}</p>
                        </div>
                        <div className="contract-actions">
                            <button
                                className="contract-btn-accept"
                                onClick={() => setConfirmAceptarCambio(true)}
                                disabled={saving}
                            >
                                Aceptar cambio de fecha
                            </button>
                            <button
                                className="contract-btn-reject"
                                onClick={() => setConfirmCancelarCambio(true)}
                                disabled={saving}
                            >
                                Rechazar y cancelar el evento
                            </button>
                        </div>
                    </section>
                )}

                {/* MODIFICACION RECHAZADA (decision del cliente) */}
                {tieneModRechazada && (
                    <section className="contract-section contract-mod-rechazada">
                        <div className="contract-mod-alert contract-mod-alert-red">
                            <strong>MODIFICACIÓN RECHAZADA</strong>
                            <span>
                                El administrador rechazó tu solicitud de modificación
                                {contract.modificationReviewedAt
                                    ? ` el ${formatDate(contract.modificationReviewedAt)}`
                                    : ""}. Tu contrato sigue vigente con los datos originales.
                            </span>
                        </div>
                        <p className="contract-mod-meta">
                            Estos son los cambios que habías solicitado y que quedaron sin efecto:
                        </p>
                        {modNuevos.length > 0 ? (
                            <div className="contract-mod-diff">
                                {modNuevos.map((nv, i) => (
                                    <div className="contract-mod-diff-row" key={i}>
                                        <div className="contract-mod-diff-campo">{nv.campo}</div>
                                        <div className="contract-mod-diff-val nuevo contract-mod-diff-val-full">{nv.valor}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="contract-mod-meta">No se detectaron cambios en los datos del evento.</p>
                        )}
                        {!!contract.modificationComment && (
                            <div className="contract-mod-comment">
                                <strong>Comentario que dejaste en la solicitud:</strong>
                                <p>{contract.modificationComment}</p>
                            </div>
                        )}
                        <p className="contract-mod-meta">
                            Decidí cómo querés continuar con el evento:
                        </p>
                        <div className="contract-actions">
                            <button className="contract-btn-save" onClick={handleContinuarContrato} disabled={saving}>
                                {saving ? "Procesando..." : "Continuar con el contrato como estaba"}
                            </button>
                            <button className="contract-btn-reject" onClick={() => setConfirmCancelar(true)} disabled={saving}>
                                Rechazar y cancelar el evento
                            </button>
                        </div>
                    </section>
                )}

                {/* CONTRATO MODIFICADO (admin: pendiente de firma tras modificacion) */}
                {rol === "administrador" &&
                    contract.modificationStatus === "aprobada" &&
                    ["en_revision", "aprobado"].includes(contract.status) && (
                        <section className="contract-section contract-mod-revision">
                            <div className="contract-mod-alert">
                                <strong>CONTRATO MODIFICADO — PENDIENTE DE FIRMA</strong>
                                <span>
                                    Este contrato tiene una modificación aprobada y aplicada el {formatDate(contract.modificationReviewedAt)}.
                                    Quedó pendiente de la firma del cliente.
                                </span>
                            </div>
                            <p className="contract-mod-meta">
                                Solicitud del {formatDate(contract.modificationRequestedAt)}.
                            </p>
                            {modAppliedList.length > 0 ? (
                                <div className="contract-mod-diff">
                                    {modAppliedList.map((app, i) => (
                                        <div className="contract-mod-diff-row" key={i}>
                                            <div className="contract-mod-diff-campo">{app.campo}</div>
                                            <div className="contract-mod-diff-val nuevo contract-mod-diff-val-full">{app.valor}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="contract-mod-meta">Modificación sin cambios de datos, solo comentario.</p>
                            )}
                            <div className="contract-mod-comment">
                                <strong>Comentario del cliente:</strong>
                                <p>{contract.modificationComment || "Sin comentario."}</p>
                            </div>
                        </section>
                    )}

                {/* CAMBIO DE FECHA PENDIENTE DE RESPUESTA (admin) */}
                {rol === "administrador" && esCambioFechaAdmin && tieneModPendiente && (
                    <section className="contract-section contract-mod-solicitando">
                        <div className="contract-mod-alert">
                            <strong>CAMBIO DE FECHA PROPUESTO — ESPERANDO AL CLIENTE</strong>
                            <span>
                                Le propusiste al cliente una nueva fecha para el evento. El
                                contrato quedará en revisión hasta que acepte el cambio o
                                cancele el evento.
                            </span>
                        </div>
                        <div className="contract-mod-diff">
                            {modDiffs.map((diff, i) => (
                                <div className="contract-mod-diff-row" key={i}>
                                    <div className="contract-mod-diff-campo">{diff.campo}</div>
                                    <div className="contract-mod-diff-val actual">{diff.actual}</div>
                                    <div className="contract-mod-diff-arrow">→</div>
                                    <div className="contract-mod-diff-val nuevo">{diff.nuevo}</div>
                                </div>
                            ))}
                        </div>
                        <div className="contract-mod-comment">
                            <strong>Motivo enviado al cliente:</strong>
                            <p>{contract.modificationComment || "Sin motivo informado."}</p>
                        </div>
                    </section>
                )}

                {/* REVISION DE MODIFICACION (admin) */}
                {rol === "administrador" && tieneModPendiente && contract.modificationData && !esCambioFechaAdmin && (
                    <section className="contract-section contract-mod-revision">
                        <div className="contract-mod-alert">
                            <strong>MODIFICACIÓN SOLICITADA</strong>
                            <span>
                                El cliente firmó el contrato y propuso estos cambios al evento. Estos son
                                UNICAMENTE los datos que quiere cambiar. Si los aprobás, el contrato vuelve
                                al cliente como pendiente de firma; si los rechazás, el contrato mantiene sus
                                datos vigentes y el cliente decide cómo continuar.
                            </span>
                        </div>
                        <p className="contract-mod-meta">
                            Solicitud del {formatDate(contract.modificationRequestedAt)}. Verificá los datos nuevos propuestos:
                        </p>

                        {modNuevos.length > 0 ? (
                            <div className="contract-mod-diff">
                                {modNuevos.map((nv, i) => (
                                    <div className="contract-mod-diff-row" key={i}>
                                        <div className="contract-mod-diff-campo">{nv.campo}</div>
                                        <div className="contract-mod-diff-val nuevo contract-mod-diff-val-full">{nv.valor}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="contract-mod-meta">
                                No se detectaron cambios en los datos del evento; revisá el comentario del cliente.
                            </p>
                        )}

                        <div className="contract-mod-comment">
                            <strong>Comentario del cliente:</strong>
                            <p>{contract.modificationComment || "Sin comentario."}</p>
                        </div>

                        <div className="contract-actions contract-mod-actions">
<button className="contract-btn-reject" onClick={() => setRejectOpen(true)} disabled={saving}>
                        Rechazar modificación
                    </button>
                            <button className="contract-btn-accept" onClick={() => handleRevisarMod("aprobar")} disabled={saving}>
                                Aprobar modificación
                            </button>
                        </div>
                    </section>
                )}

                {/* ACCIONES */}
                <section className="contract-actions">

                    {rol === "cliente" && canEdit && (
                        <>
                            <button className="contract-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button className="contract-btn-primary" onClick={handleEnviar} disabled={saving}>
                                Enviar para revisión
                            </button>
                        </>
                    )}

                    {rol === "cliente" && contract.status === "aprobado" && (
                        <button className="contract-btn-accept" onClick={() => setShowTerminos(true)} disabled={saving}>
                            Aceptar contrato (firmar)
                        </button>
                    )}

                    {rol === "cliente" && contract.status === "firmado" && !modificando && !tieneModPendiente && !tieneModRechazada && puedeSolicitarMod && (
                        <button className="contract-btn-primary" onClick={() => setModificando(true)} disabled={saving}>
                            Solicitar modificación
                        </button>
                    )}

                    {rol === "cliente" &&
                        contract.status === "firmado" &&
                        !modificando &&
                        !tieneModPendiente &&
                        diasHastaEvento !== null &&
                        diasHastaEvento >= 1 && (
                            <button className="contract-btn-reject" onClick={() => setConfirmEliminar(true)} disabled={saving}>
                                Eliminar contrato
                            </button>
                        )}

                    {rol === "cliente" && contract.status === "firmado" && modificando && (
                        <>
                            <button className="contract-btn-primary" onClick={handleSolicitarMod} disabled={saving}>
                                {saving ? "Enviando..." : "Enviar solicitud de modificación"}
                            </button>
                            <button className="contract-btn-save" onClick={() => setModificando(false)} disabled={saving}>
                                Cancelar
                            </button>
                        </>
                    )}

                    {rol === "cliente" && contract.status === "firmado" && !modificando && tieneModPendiente && (
                        <p className="contract-pending-note">
                            Tu solicitud de modificación está pendiente de aprobación por el administrador. Por ahora no podés solicitar otra.
                        </p>
                    )}

                    {rol === "cliente" && contract.status === "firmado" && !modificando && !tieneModPendiente && !tieneModRechazada && !puedeSolicitarMod && (
                        <p className="contract-pending-note">
                            No se admiten más modificaciones: las solicitudes se aceptan hasta 2 semanas antes del evento.
                        </p>
                    )}

                    {rol === "cliente" && contract.status !== "aprobado" && !canEdit && contract.status !== "firmado" && !tieneCambioFechaAdminPendiente && (
                        <p className="contract-pending-note">
                            El contrato está en revisión por el administrador.
                        </p>
                    )}

                </section>

            </main>

            </div>

            {modificando && (
                <div className="contract-mod-screen-backdrop" onClick={() => setModificando(false)}>
                    <div className="contract-mod-screen" onClick={(e) => e.stopPropagation()}>
                        <button className="contract-terms-close" onClick={() => setModificando(false)} aria-label="Cerrar">✕</button>
                        <h3>Pedido de modificación</h3>
                        <p className="contract-terms-intro">
                            Completá SOLO los datos que querés cambiar del contrato firmado
                            {diasHastaEvento !== null ? ` (faltan ${diasHastaEvento} días para el evento)` : ""}.
                            Al enviar, el administrador verá únicamente estos cambios para aprobarlos o rechazarlos.
                        </p>

                        <div className="contract-mod-screen-fields">
                            <div className="contract-field">
                                <label>Fecha del evento</label>
                                <input type="date" name="dateEvent" value={form.dateEvent} onChange={handleChange} />
                            </div>

                            <div className="contract-field">
                                <label>Tipo de evento</label>
                                <select name="eventType" value={form.eventType} onChange={handleChange}>
                                    <option value="" disabled>Seleccioná el tipo de evento...</option>
                                    {EVENT_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="contract-field">
                                <label>Cantidad exacta de invitados</label>
                                <input
                                    type="number"
                                    name="cantExactaInvit"
                                    value={form.cantExactaInvit}
                                    onChange={handleChange}
                                    min={reservation.cantInvit}
                                    max={reservation.maxCantInvit}
                                    placeholder={`${reservation.cantInvit} - ${reservation.maxCantInvit}`}
                                />
                                <small>Debe estar entre {reservation.cantInvit} y {reservation.maxCantInvit} invitados.</small>
                            </div>

                            <div className="contract-field">
                                <label>Hora de inicio del evento</label>
                                <input type="time" name="eventStartTime" value={form.eventStartTime} onChange={handleChange} />
                            </div>

                            <div className="contract-field">
                                <label>Hora de fin del evento</label>
                                <input type="time" name="eventEndTime" value={form.eventEndTime} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="contract-field">
                            <label>Menú por persona</label>
                            {mountData.cardDetails.map((menu) => (
                                <label className="contract-option" key={menu.idCardDetail}>
                                    <input
                                        type="radio"
                                        name="idCardDetail"
                                        value={menu.idCardDetail}
                                        checked={form.idCardDetail === String(menu.idCardDetail)}
                                        onChange={handleChange}
                                    />
                                    <span><strong>{menu.menuStage}</strong> — {menu.detail} ({currency(menu.budget)} por persona)</span>
                                </label>
                            ))}
                        </div>

                        <div className="contract-field">
                            <label>Servicios extras</label>
                            {mountData.extraServices.map((service) => (
                                <label className="contract-option" key={service.idService}>
                                    <input
                                        type="checkbox"
                                        checked={form.idServices.includes(service.idService)}
                                        onChange={() => handleServiceChange(service.idService)}
                                    />
                                    <span><strong>{service.nameService}</strong> — {service.detailService} ({currency(service.cost)})</span>
                                </label>
                            ))}
                        </div>

                        <div className="contract-field">
                            <label>Comentario para el administrador (opcional)</label>
                            <textarea
                                className="contract-mod-screen-comment"
                                value={commentMod}
                                onChange={(e) => setCommentMod(e.target.value)}
                                placeholder="Explicá el motivo de la modificación..."
                                rows="3"
                            />
                        </div>

                        <p className="contract-mod-meta contract-mod-screen-total">
                            Valor final estimado con los datos modificados:{" "}
                            <strong>{calcLive.hasPrice ? currency(calcLive.total) : "—"}</strong>
                        </p>
                        {!calcLive.hasPrice && (
                            <small className="contract-warning">
                                No hay un precio de salón vigente cargado, por lo que se consideró $0 para el salón.
                            </small>
                        )}

                        <div className="contract-terms-actions">
                            <button className="contract-btn-save" onClick={() => setModificando(false)} disabled={saving}>
                                Cancelar
                            </button>
                            <button className="contract-btn-accept" onClick={handleSolicitarMod} disabled={saving}>
                                {saving ? "Enviando..." : "Enviar solicitud de modificación"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTerminos && (
                <div className="contract-terms-backdrop" onClick={() => setShowTerminos(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="contract-terms-close" onClick={() => setShowTerminos(false)} aria-label="Cerrar">✕</button>
                        <h3>Confirmación de firma</h3>
                        <p className="contract-terms-intro">
                            Antes de aceptar, leé con atención. Al confirmar asumís el compromiso de cumplir
                            este contrato.
                        </p>
                        <ul className="contract-terms-list">
                            {(contract.clausulas?.terminos || []).map((text, i) => (
                                <li key={i}>{text}</li>
                            ))}
                        </ul>
                        <div className="contract-terms-actions">
                            <button className="contract-btn-save" onClick={() => setShowTerminos(false)} disabled={saving}>
                                Volver
                            </button>
                            <button
                                className="contract-btn-accept"
                                onClick={() => {
                                    setShowTerminos(false);
                                    setConfirmFirma(true);
                                }}
                                disabled={saving}
                            >
                                Acepto y confirmo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmFirma && (
                <div className="contract-terms-backdrop" onClick={() => !saving && setConfirmFirma(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="contract-terms-close"
                            onClick={() => !saving && setConfirmFirma(false)}
                            aria-label="Cerrar"
                            disabled={saving}
                        >
                            ✕
                        </button>
                        <h3>¿Confirmás la firma del contrato?</h3>
                        <p className="contract-terms-intro">
                            Estás por firmar el contrato #{contract.idContract}
                            {fecEvento ? ` para el evento del ${formatDate(fecEvento)}` : ""}.
                            Al confirmar, el contrato quedará vigente y se notificará al administrador.
                        </p>
                        <p className="contract-terms-intro contract-terms-warning">
                            <strong>Esta acción tiene efecto inmediato.</strong> Si todavía no estás seguro,
                            podés volver y revisar el contrato antes de firmar.
                        </p>
                        <div className="contract-terms-actions">
                            <button
                                className="contract-btn-save"
                                onClick={() => setConfirmFirma(false)}
                                disabled={saving}
                            >
                                Volver
                            </button>
                            <button
                                className="contract-btn-accept"
                                onClick={handleAceptar}
                                disabled={saving}
                            >
                                {saving ? "Firmando..." : "Sí, firmar contrato"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmCancelar && (
                <div className="contract-terms-backdrop" onClick={() => setConfirmCancelar(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="contract-terms-close" onClick={() => setConfirmCancelar(false)} aria-label="Cerrar">✕</button>
                        <h3>Cancelar el evento</h3>
                        <p className="contract-terms-intro">
                            Esta acción da de baja el contrato y cancela la reserva del evento.
                            No se puede deshacer.
                        </p>
                        <div className="contract-terms-actions">
                            <button className="contract-btn-save" onClick={() => setConfirmCancelar(false)} disabled={saving}>
                                Volver
                            </button>
                            <button className="contract-btn-reject" onClick={handleCancelarEvento} disabled={saving}>
                                {saving ? "Cancelando..." : "Sí, cancelar el evento"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmEliminar && (
                <div className="contract-terms-backdrop" onClick={() => setConfirmEliminar(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="contract-terms-close" onClick={() => setConfirmEliminar(false)} aria-label="Cerrar">✕</button>
                        <h3>Eliminar el contrato</h3>
                        <p className="contract-terms-intro">
                            Esta acción elimina el contrato #{contract.idContract} y da de baja tu evento
                            {fecEvento ? ` del ${formatDate(fecEvento)}` : ""}. No se puede deshacer.
                        </p>
                        <p className="contract-terms-intro contract-terms-warning">
                            <strong>No habrá reembolso del dinero:</strong> los pagos que hayas realizado
                            no se devuelven.
                        </p>
                        <div className="contract-terms-actions">
                            <button className="contract-btn-save" onClick={() => setConfirmEliminar(false)} disabled={saving}>
                                Volver
                            </button>
                            <button className="contract-btn-reject" onClick={handleEliminarContrato} disabled={saving}>
                                {saving ? "Eliminando..." : "Sí, eliminar el contrato"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmCambioFecha && (
                <div className="contract-terms-backdrop" onClick={() => !saving && setConfirmCambioFecha(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="contract-terms-close"
                            onClick={() => !saving && setConfirmCambioFecha(false)}
                            aria-label="Cerrar"
                            disabled={saving}
                        >
                            ✕
                        </button>
                        <h3>Confirmar cambio de fecha</h3>
                        <p className="contract-terms-intro">
                            Vas a proponer reprogramar el evento del{" "}
                            <strong>{formatDate(reservation.dateEvent)}</strong> al{" "}
                            <strong>{formatDate(adminDate)}</strong>.
                        </p>
                        <p className="contract-terms-intro contract-terms-warning">
                            El contrato quedará en revisión hasta que el cliente acepte el cambio
                            o cancele el evento. Se le enviará una notificación con el motivo.
                        </p>
                        <textarea
                            className="contract-reason-textarea"
                            value={motivoCambioFecha}
                            onChange={(e) => setMotivoCambioFecha(e.target.value)}
                            placeholder="Escribí el motivo del cambio de fecha..."
                            rows="4"
                        />
                        <div className="contract-terms-actions">
                            <button
                                className="contract-btn-save"
                                onClick={() => setConfirmCambioFecha(false)}
                                disabled={saving}
                            >
                                Volver
                            </button>
                            <button
                                className="contract-btn-accept"
                                onClick={handleSolicitarCambioFecha}
                                disabled={saving}
                            >
                                {saving ? "Enviando..." : "Sí, proponer nueva fecha"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAceptarCambio && (
                <div className="contract-terms-backdrop" onClick={() => !saving && setConfirmAceptarCambio(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="contract-terms-close"
                            onClick={() => !saving && setConfirmAceptarCambio(false)}
                            aria-label="Cerrar"
                            disabled={saving}
                        >
                            ✕
                        </button>
                        <h3>¿Aceptás el cambio de fecha?</h3>
                        <p className="contract-terms-intro">
                            El evento pasará del{" "}
                            <strong>{formatDate(reservation.dateEvent)}</strong> al{" "}
                            <strong>{formatDate(contract.modificationData?.dateEvent)}</strong>.
                            Al confirmar, se actualizará la reserva y se notificará al administrador.
                        </p>
                        <p className="contract-terms-intro contract-terms-warning">
                            <strong>Esta acción tiene efecto inmediato.</strong> Si no estás de
                            acuerdo con la nueva fecha, podés rechazarla y cancelar el evento.
                        </p>
                        <div className="contract-terms-actions">
                            <button
                                className="contract-btn-save"
                                onClick={() => setConfirmAceptarCambio(false)}
                                disabled={saving}
                            >
                                Volver
                            </button>
                            <button
                                className="contract-btn-accept"
                                onClick={handleAceptarCambioFecha}
                                disabled={saving}
                            >
                                {saving ? "Aceptando..." : "Sí, aceptar cambio"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmCancelarCambio && (
                <div className="contract-terms-backdrop" onClick={() => !saving && setConfirmCancelarCambio(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="contract-terms-close"
                            onClick={() => !saving && setConfirmCancelarCambio(false)}
                            aria-label="Cerrar"
                            disabled={saving}
                        >
                            ✕
                        </button>
                        <h3>Rechazar cambio y cancelar el evento</h3>
                        <p className="contract-terms-intro">
                            Si rechazás el cambio de fecha, el contrato y la reserva del evento
                            serán dados de baja. Esta acción no se puede deshacer.
                        </p>
                        <p className="contract-terms-intro contract-terms-warning">
                            <strong>No habrá reembolso del dinero:</strong> los pagos que hayas
                            realizado no se devuelven.
                        </p>
                        <textarea
                            className="contract-reason-textarea"
                            value={motivoCancelarCambio}
                            onChange={(e) => setMotivoCancelarCambio(e.target.value)}
                            placeholder="Escribí el motivo por el que cancelás el evento..."
                            rows="4"
                        />
                        <div className="contract-terms-actions">
                            <button
                                className="contract-btn-save"
                                onClick={() => setConfirmCancelarCambio(false)}
                                disabled={saving}
                            >
                                Volver
                            </button>
                            <button
                                className="contract-btn-reject"
                                onClick={handleCancelarCambioFecha}
                                disabled={saving}
                            >
                                {saving ? "Cancelando..." : "Sí, cancelar el evento"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectOpen && (
                <div className="contract-terms-backdrop" onClick={() => setRejectOpen(false)}>
                    <div className="contract-terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="contract-terms-close" onClick={() => setRejectOpen(false)} aria-label="Cerrar">✕</button>
                        <h3>Rechazar modificación</h3>
                        <p className="contract-terms-intro">
                            Indicá el <strong>motivo</strong> del rechazo. Se lo notificaremos al cliente
                            junto con el aviso de que sus datos vigentes se conservan.
                        </p>
                        <textarea
                            className="contract-reason-textarea"
                            value={rejectMotivo}
                            onChange={(e) => setRejectMotivo(e.target.value)}
                            placeholder="Escribí el motivo del rechazo..."
                            rows="4"
                        />
                        <div className="contract-terms-actions">
                            <button className="contract-btn-save" onClick={() => setRejectOpen(false)} disabled={saving}>
                                Volver
                            </button>
                            <button className="contract-btn-reject" onClick={handleConfirmRechazo} disabled={saving}>
                                {saving ? "Rechazando..." : "Confirmar rechazo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportingPayment && (
                <div className="contract-terms-backdrop" onClick={() => setReportingPayment(null)}>
                    <div className="contract-terms-modal contract-payment-report-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="contract-terms-close"
                            onClick={() => setReportingPayment(null)}
                            aria-label="Cerrar"
                            type="button"
                        >
                            ✕
                        </button>
                        <h3>Informar pago</h3>
                        <p className="contract-terms-intro">
                            Contrato #{contract.idContract} · {reportingPayment.concept || "Cuota"} ·{" "}
                            {currency(reportingPayment.value)}
                        </p>

                        <form onSubmit={handleReportSubmit} className="contract-payment-report-form">
                            <div className="contract-payment-report-grid">
                                <div className="form-group">
                                    <label>Fecha de pago</label>
                                    <input
                                        type="date"
                                        name="reportedPaymentDate"
                                        value={reportForm.reportedPaymentDate}
                                        onChange={handleReportChange}
                                        max={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Medio de pago</label>
                                    <select
                                        name="reportedMethod"
                                        value={reportForm.reportedMethod}
                                        onChange={handleReportChange}
                                        required
                                    >
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Mercado Pago">Mercado Pago</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Referencia / comprobante</label>
                                    <input
                                        type="text"
                                        name="reportedReference"
                                        value={reportForm.reportedReference}
                                        onChange={handleReportChange}
                                        placeholder="Número de operación"
                                        maxLength={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Comprobante (opcional)</label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                        onChange={(event) =>
                                            setReportProof(event.target.files?.[0] || null)
                                        }
                                    />
                                    <small>JPG, PNG, WEBP, GIF o PDF. Máximo 5 MB.</small>
                                </div>

                                <div className="form-group full-width">
                                    <label>Notas</label>
                                    <textarea
                                        name="reportedNotes"
                                        value={reportForm.reportedNotes}
                                        onChange={handleReportChange}
                                        placeholder="Información adicional del pago..."
                                        maxLength={500}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="contract-terms-actions">
                                <button
                                    type="button"
                                    className="contract-btn-save"
                                    onClick={() => setReportingPayment(null)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="contract-btn-accept" disabled={saving}>
                                    {saving ? "Enviando..." : "Informar pago"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {message && (
                <FeedbackModal
                    type={message.type}
                    title={message.title}
                    message={message.text}
                    onClose={closeMessage}
                />
            )}

        </div>
    );
}

export default ContractDetail;
