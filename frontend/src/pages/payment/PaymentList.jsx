import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    buildAssetUrl,
    contractService,
    paymentService
} from "../../services";
import FeedbackModal from "../../components/FeedbackModal";
import "../extraService/extraServiceList.css";
import "./PaymentList.css";

const STATUS_LABEL = {
    pendiente: "Pendiente",
    "seña": "Seña abonada",
    pagado: "Pagado"
};

const PAID_STATUSES = ["seña", "pagado"];

const normalizeConcept = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const REPORT_STATUS_LABEL = {
    pendiente: "Reportado",
    confirmado: "Confirmado",
    rechazado: "Rechazado"
};

const TEMPLATE_TABS = [
    { value: "pending", label: "Pago pendiente" },
    { value: "reminder", label: "Recordatorio" },
    { value: "confirmed", label: "Pago confirmado" }
];

const IconCard = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
);

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
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

const IconEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const IconBell = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const IconSettings = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const emptyCreateForm = () => ({
    mode: "unico",
    idContract: "",
    concept: "Cuota",
    value: "",
    dueDate: "",
    statusPayment: "pendiente",
    datePayment: new Date().toISOString().split("T")[0],
    notes: "",
    installmentsCount: 3,
    interest: 0,
    firstDueDate: new Date().toISOString().split("T")[0]
});

const getStatusChangeFeedback = (previousStatus, nextStatus, concept) => {
    if (!nextStatus || previousStatus === nextStatus) return null;

    const subject = concept ? `El pago "${concept}"` : "El pago";

    if (nextStatus === "pendiente") {
        return {
            title: "Pago reabierto",
            message: `${subject} volvió a estado pendiente.`
        };
    }

    if (nextStatus === "seña") {
        return {
            title: "Seña registrada",
            message: `${subject} quedó registrado como seña abonada.`
        };
    }

    if (nextStatus === "pagado") {
        return {
            title: "Pago confirmado",
            message: `${subject} quedó registrado como pagado.`
        };
    }

    return null;
};

function PaymentList() {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState("todos");
    const [feedback, setFeedback] = useState(null);

    const [detail, setDetail] = useState(null);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState(emptyCreateForm());
    const [deleting, setDeleting] = useState(null);
    const [sendingId, setSendingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [reportDetail, setReportDetail] = useState(null);
    const [reportRejecting, setReportRejecting] = useState(false);
    const [reportRejectReason, setReportRejectReason] = useState("");
    const [reportSaving, setReportSaving] = useState(false);

    const [emailTemplates, setEmailTemplates] = useState(null);
    const [emailTemplatesOpen, setEmailTemplatesOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState("pending");
    const [templateSaving, setTemplateSaving] = useState(false);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        depositPercentage: 30,
        reminderDaysBeforeEvent: 7,
        remindersEnabled: true
    });

    const showFeedback = (type, title, message) => {
        setFeedback({ type, title, message });
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const [paymentsData, contractsData, settingsData, templatesData] =
                await Promise.all([
                    paymentService.getAll(),
                    contractService.getAll(),
                    paymentService.getSettings(),
                    paymentService.getEmailTemplates()
                ]);

            setPayments(paymentsData);
            setContracts(contractsData);
            setSettings(settingsData);
            setSettingsForm(settingsData);
            setEmailTemplates(templatesData);
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currency = (value) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS"
        }).format(Number(value) || 0);

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("es-AR");
    };

    const isOverdue = (payment) => {
        if (payment.statusPayment !== "pendiente" || !payment.dueDate) {
            return false;
        }
        const due = new Date(payment.dueDate);
        if (Number.isNaN(due.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due.getTime() < today.getTime();
    };

    const clientName = (payment) => {
        const client = payment.contract?.reservation?.client;
        if (!client) return "—";
        return `${client.nameCli || ""} ${client.surnameCli || ""}`.trim();
    };

    const filteredPayments = (() => {
        if (filter === "pendiente") {
            return payments.filter((p) => p.statusPayment === "pendiente");
        }
        if (filter === "abonado") {
            return payments.filter((p) => PAID_STATUSES.includes(p.statusPayment));
        }
        if (filter === "vencido") {
            return payments.filter(isOverdue);
        }
        if (filter === "reportado") {
            return payments.filter((p) => p.reportStatus === "pendiente");
        }
        return payments;
    })();

    const reportedCount = payments.filter(
        (p) => p.reportStatus === "pendiente"
    ).length;

    const pendingAmount = payments
        .filter((p) => p.statusPayment === "pendiente")
        .reduce((acc, p) => acc + Number(p.value || 0), 0);

    const pendingByContract = payments.reduce((acc, payment) => {
        if (payment.statusPayment !== "pendiente") return acc;
        const idContract = Number(payment.idContract);
        acc[idContract] = (acc[idContract] || 0) + 1;
        return acc;
    }, {});

    const paidAmount = payments
        .filter((p) => PAID_STATUSES.includes(p.statusPayment))
        .reduce((acc, p) => acc + Number(p.value || 0), 0);

    const isInstallmentMode = createForm.mode === "cuotas";
    const selectedContract = contracts.find(
        (contract) =>
            String(contract.idContract) === String(createForm.idContract)
    );
    const selectedFinalValue = Number(selectedContract?.finalValue) || 0;
    const depositPercentage = Number(settings?.depositPercentage ?? 30);
    const selectedPayments = selectedContract
        ? payments.filter(
              (payment) =>
                  Number(payment.idContract) ===
                  Number(selectedContract.idContract)
          )
        : [];
    const existingDeposit = selectedPayments.find((payment) => {
        const concept = String(payment.concept || "").toLowerCase();
        const match = concept.match(/cuota\s*#\s*(\d+)/i);
        return (
            concept.includes("seña") ||
            concept.includes("sena") ||
            (match && Number(match[1]) === 1)
        );
    });
    const estimatedDeposit = existingDeposit
        ? Number(existingDeposit.value)
        : (selectedFinalValue * depositPercentage) / 100;
    const paidOtherTotal = selectedPayments
        .filter(
            (payment) =>
                PAID_STATUSES.includes(payment.statusPayment) &&
                payment.idPayment !== existingDeposit?.idPayment
        )
        .reduce((acc, payment) => acc + Number(payment.value || 0), 0);
    const protectedPendingTotal = selectedPayments
        .filter((payment) => {
            if (payment.statusPayment !== "pendiente") return false;
            if (payment.idPayment === existingDeposit?.idPayment) return false;

            const concept = normalizeConcept(payment.concept);
            return (
                !concept.includes("saldo") &&
                !concept.includes("ajuste") &&
                !/cuota\s*#\s*\d+/.test(concept)
            );
        })
        .reduce((acc, payment) => acc + Number(payment.value || 0), 0);
    const installmentInterest = Number(createForm.interest) || 0;
    const installmentTotal = selectedFinalValue + installmentInterest;
    const installmentRemaining = Math.max(
        0,
        installmentTotal -
            estimatedDeposit -
            paidOtherTotal -
            protectedPendingTotal
    );
    const installmentCountValue = Number(createForm.installmentsCount) || 0;
    const installmentValue =
        installmentCountValue > 0
            ? installmentRemaining / installmentCountValue
            : 0;

    const handleCreateChange = (event) => {
        const { name, value } = event.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateKeyDown = (event) => {
        if (event.key !== "Enter") return;
        if (["TEXTAREA", "BUTTON"].includes(event.target.tagName)) return;
        event.preventDefault();
    };

    const handleModeChange = (mode) => {
        setCreateForm((prev) => ({ ...prev, mode }));
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            if (isInstallmentMode) {
                await paymentService.generateInstallments({
                    idContract: Number(createForm.idContract),
                    installmentsCount: Number(createForm.installmentsCount),
                    interest: Number(createForm.interest || 0),
                    firstDueDate: createForm.firstDueDate,
                    notes: createForm.notes || null
                });
                showFeedback(
                    "success",
                    "Cuotas generadas",
                    "Las cuotas se generaron correctamente."
                );
            } else {
                await paymentService.create({
                    idContract: Number(createForm.idContract),
                    concept: createForm.concept.trim() || "Cuota",
                    value: Number(createForm.value),
                    dueDate: createForm.dueDate || null,
                    statusPayment: createForm.statusPayment,
                    datePayment: createForm.datePayment || undefined,
                    notes: createForm.notes || null
                });
                showFeedback(
                    "success",
                    "Pago creado",
                    "El pago se registró correctamente."
                );
            }

            setCreating(false);
            setCreateForm(emptyCreateForm());
            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditing((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const original = payments.find(
                (payment) => payment.idPayment === editing.idPayment
            );
            const statusFeedback = getStatusChangeFeedback(
                original?.statusPayment,
                editing.statusPayment,
                editing.concept
            );

            await paymentService.update(editing.idPayment, {
                concept: editing.concept,
                value: Number(editing.value),
                dueDate: editing.dueDate || null,
                statusPayment: editing.statusPayment,
                notes: editing.notes || null
            });

            setEditing(null);

            if (statusFeedback) {
                showFeedback("success", statusFeedback.title, statusFeedback.message);
            } else {
                showFeedback("success", "Pago actualizado", "Los cambios se guardaron correctamente.");
            }

            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setSaving(true);

        try {
            await paymentService.remove(deleting.idPayment);
            setDeleting(null);
            showFeedback("success", "Pago eliminado", "El pago pendiente fue dado de baja.");
            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendReminder = async (payment) => {
        setSendingId(payment.idPayment);

        try {
            await paymentService.sendReminder(payment.idPayment);
            showFeedback(
                "success",
                "Recordatorio enviado",
                "Se notificó al cliente por la campana y por correo."
            );
            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setSendingId(null);
        }
    };

    const openReportDetail = (payment) => {
        setReportDetail(payment);
        setReportRejecting(false);
        setReportRejectReason("");
    };

    const handleConfirmReport = async () => {
        if (!reportDetail) return;
        setReportSaving(true);

        try {
            const result = await paymentService.confirmReport(reportDetail.idPayment);
            const statusFeedback = getStatusChangeFeedback(
                reportDetail.statusPayment,
                result?.payment?.statusPayment,
                reportDetail.concept
            );

            setReportDetail(null);

            if (statusFeedback) {
                showFeedback("success", statusFeedback.title, statusFeedback.message);
            } else {
                showFeedback(
                    "success",
                    "Pago confirmado",
                    "El pago se marcó como abonado y se notificó al cliente."
                );
            }

            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setReportSaving(false);
        }
    };

    const handleRejectReport = async () => {
        if (!reportDetail) return;

        const reason = reportRejectReason.trim();
        if (!reason) {
            showFeedback("error", "Motivo requerido", "Indicá por qué rechazás el reporte.");
            return;
        }

        setReportSaving(true);

        try {
            await paymentService.rejectReport(reportDetail.idPayment, { reason });
            setReportDetail(null);
            showFeedback(
                "success",
                "Reporte rechazado",
                "El cliente podrá volver a informar el pago."
            );
            await loadData();
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setReportSaving(false);
        }
    };

    const handleTemplateChange = (field, value) => {
        setEmailTemplates((prev) => ({
            ...prev,
            [activeTemplate]: {
                ...prev[activeTemplate],
                [field]: value
            }
        }));
    };

    const handleSaveTemplates = async (event) => {
        event.preventDefault();
        if (!emailTemplates) return;
        setTemplateSaving(true);

        try {
            const templates = await paymentService.updateEmailTemplates({
                pending: emailTemplates.pending,
                reminder: emailTemplates.reminder,
                confirmed: emailTemplates.confirmed
            });

            setEmailTemplates(templates);
            showFeedback(
                "success",
                "Plantillas guardadas",
                "Los mensajes de email se actualizaron correctamente."
            );
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setTemplateSaving(false);
        }
    };

    const handleResetTemplates = async () => {
        setTemplateSaving(true);

        try {
            const templates = await paymentService.resetEmailTemplates();
            setEmailTemplates(templates);
            showFeedback(
                "success",
                "Plantillas restauradas",
                "Se volvieron a cargar los mensajes predeterminados."
            );
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setTemplateSaving(false);
        }
    };

    const openSettings = () => {
        setSettingsForm(
            settings || {
                depositPercentage: 30,
                reminderDaysBeforeEvent: 7,
                remindersEnabled: true
            }
        );
        setSettingsOpen(true);
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const data = await paymentService.updateSettings({
                depositPercentage: Number(settingsForm.depositPercentage),
                reminderDaysBeforeEvent: Number(settingsForm.reminderDaysBeforeEvent),
                remindersEnabled: Boolean(settingsForm.remindersEnabled)
            });

            setSettings(data.settings);
            setSettingsOpen(false);
            showFeedback("success", "Configuración guardada", "Los valores de pagos se actualizaron.");
        } catch (error) {
            showFeedback("error", "Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditStart = (payment) => {
        setEditing({
            ...payment,
            dueDate: payment.dueDate ? String(payment.dueDate).split("T")[0] : ""
        });
    };

    return (
        <div className="page-wrapper">
            <div className="client-dashboard table-list-dashboard">
                <header className="dashboard-header-flex">
                    <div className="header-title-group">
                        <div className="header-icon">
                            <IconCard />
                        </div>
                        <div>
                            <h1>Gestión de Pagos</h1>
                            <p>Cuotas, señas, saldos y recordatorios de los contratos.</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn-back-panel"
                            onClick={() => navigate("/admin-home")}
                        >
                            <IconArrowLeft />
                            Volver al Panel
                        </button>

                        <button
                            type="button"
                            className="btn-back-panel payment-settings-btn"
                            onClick={openSettings}
                        >
                            <IconSettings />
                            Configuración
                        </button>

                        <button
                            type="button"
                            className="btn-back-panel payment-settings-btn"
                            onClick={() => setEmailTemplatesOpen(true)}
                        >
                            <IconMail />
                            Mensajes de email
                        </button>

                        <button
                            type="button"
                            className="btn-submit-cyan"
                            onClick={() => {
                                setCreateForm(emptyCreateForm());
                                setCreating(true);
                            }}
                        >
                            <IconPlus />
                            Nuevo Pago
                        </button>
                    </div>
                </header>

                <div className="payment-summary-grid">
                    <div className="payment-summary-card">
                        <span>Pendientes</span>
                        <strong>{currency(pendingAmount)}</strong>
                        <small>{payments.filter((p) => p.statusPayment === "pendiente").length} cuota(s)</small>
                    </div>
                    <div className="payment-summary-card paid">
                        <span>Cobrado</span>
                        <strong>{currency(paidAmount)}</strong>
                        <small>{payments.filter((p) => PAID_STATUSES.includes(p.statusPayment)).length} pago(s)</small>
                    </div>
                    <div className="payment-summary-card config">
                        <span>Seña</span>
                        <strong>{settings?.depositPercentage ?? 30}%</strong>
                        <small>
                            Recordatorio {settings?.reminderDaysBeforeEvent ?? 7} días antes
                            {settings?.remindersEnabled === false ? " (desactivado)" : ""}
                        </small>
                    </div>
                    <div className="payment-summary-card reported">
                        <span>Reportados</span>
                        <strong>{reportedCount}</strong>
                        <small>Pagos informados por clientes</small>
                    </div>
                </div>

                <div className="payment-filters">
                    {[
                        { value: "todos", label: "Todos" },
                        { value: "pendiente", label: "Pendientes" },
                        { value: "abonado", label: "Abonados" },
                        { value: "reportado", label: "Reportados" },
                        { value: "vencido", label: "Vencidos" }
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`payment-filter-btn ${filter === option.value ? "active" : ""}`}
                            onClick={() => setFilter(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="form-card full-width">
                    <div className="card-body-table">
                        {loading ? (
                            <p className="loading-text">Cargando pagos...</p>
                        ) : (
                            <table className="clients-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Contrato</th>
                                        <th>Cliente</th>
                                        <th>Concepto</th>
                                        <th>Monto</th>
                                        <th>Vencimiento</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: "center" }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length > 0 ? (
                                        filteredPayments.map((payment) => (
                                            <tr key={payment.idPayment}>
                                                <td>#{payment.idPayment}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="payment-contract-link"
                                                        onClick={() => navigate(`/contract/${payment.idContract}`)}
                                                    >
                                                        #{payment.idContract}
                                                    </button>
                                                </td>
                                                <td className="font-semibold">
                                                    {clientName(payment)}
                                                </td>
                                                <td>{payment.concept || "Cuota"}</td>
                                                <td>{currency(payment.value)}</td>
                                                <td className={isOverdue(payment) ? "payment-overdue" : ""}>
                                                    {formatDate(payment.dueDate)}
                                                </td>
                                                <td>
                                                    <div className="payment-status-stack">
                                                        <span className={`payment-status-badge ${payment.statusPayment}`}>
                                                            {STATUS_LABEL[payment.statusPayment] || payment.statusPayment}
                                                        </span>
                                                        {payment.reportStatus === "pendiente" && (
                                                            <span className="payment-report-badge">
                                                                {REPORT_STATUS_LABEL.pendiente}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <button
                                                            type="button"
                                                            className="btn-action-view"
                                                            title="Ver detalle"
                                                            onClick={() => setDetail(payment)}
                                                        >
                                                            <IconEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-action-edit"
                                                            title="Editar"
                                                            onClick={() => handleEditStart(payment)}
                                                        >
                                                            <IconEdit />
                                                        </button>

                                                        {payment.reportStatus === "pendiente" && (
                                                            <button
                                                                type="button"
                                                                className="btn-action-report"
                                                                title="Revisar reporte de pago"
                                                                onClick={() => openReportDetail(payment)}
                                                            >
                                                                <IconEye />
                                                            </button>
                                                        )}

                                                        {payment.statusPayment === "pendiente" &&
                                                            payment.reportStatus !== "pendiente" && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-action-reminder"
                                                                        title="Enviar recordatorio"
                                                                        onClick={() => handleSendReminder(payment)}
                                                                        disabled={sendingId === payment.idPayment}
                                                                    >
                                                                        <IconBell />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="btn-action-delete"
                                                                        title="Eliminar"
                                                                        onClick={() => setDeleting(payment)}
                                                                    >
                                                                        <IconTrash />
                                                                    </button>
                                                                </>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="empty-table">
                                                No hay pagos para el filtro seleccionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {detail && (
                <div className="modal-backdrop">
                    <div className="modal-card-form">
                        <div className="modal-header-styled">
                            <h2>Detalle del pago</h2>
                            <button className="btn-close" onClick={() => setDetail(null)}>✕</button>
                        </div>

                        <div className="modal-detail-grid">
                            <div className="detail-item">
                                <label>Contrato</label>
                                <span>#{detail.idContract}</span>
                            </div>
                            <div className="detail-item">
                                <label>Cliente</label>
                                <span>{clientName(detail)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Concepto</label>
                                <span>{detail.concept || "Cuota"}</span>
                            </div>
                            <div className="detail-item">
                                <label>Monto</label>
                                <span>{currency(detail.value)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Estado</label>
                                <span>{STATUS_LABEL[detail.statusPayment] || detail.statusPayment}</span>
                            </div>
                            <div className="detail-item">
                                <label>Fecha de pago</label>
                                <span>{formatDate(detail.datePayment)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Vencimiento</label>
                                <span>{formatDate(detail.dueDate)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Último recordatorio</label>
                                <span>{formatDate(detail.lastReminderAt)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Notas</label>
                                <span>{detail.notes || "—"}</span>
                            </div>
                        </div>

                        <div className="modal-footer-right">
                            <button className="btn-j-primary" onClick={() => setDetail(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {creating && (
                <div className="modal-backdrop">
                    <div className={`modal-card-form ${isInstallmentMode ? "payment-installments-modal" : ""}`}>
                        <div className="modal-header-styled">
                            <h2>Nuevo pago</h2>
                            <button type="button" className="btn-close" onClick={() => setCreating(false)}>✕</button>
                        </div>

                        <form
                            onSubmit={handleCreate}
                            onKeyDown={handleCreateKeyDown}
                            className="modal-edit-form"
                        >
                            <div className="payment-mode-toggle">
                                <button
                                    type="button"
                                    className={!isInstallmentMode ? "active" : ""}
                                    onClick={() => handleModeChange("unico")}
                                >
                                    Pago único
                                </button>
                                <button
                                    type="button"
                                    className={isInstallmentMode ? "active" : ""}
                                    onClick={() => handleModeChange("cuotas")}
                                >
                                    Plan de cuotas
                                </button>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group full-width">
                                    <label>Contrato</label>
                                    <select
                                        name="idContract"
                                        value={createForm.idContract}
                                        onChange={handleCreateChange}
                                        required
                                    >
                                        <option value="">Seleccioná un contrato...</option>
                                        {contracts.map((contract) => {
                                            const pendingCount =
                                                pendingByContract[contract.idContract] || 0;
                                            const pendingLabel =
                                                pendingCount > 0
                                                    ? `(${pendingCount} pago${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"})`
                                                    : "(sin pagos pendientes)";

                                            return (
                                                <option key={contract.idContract} value={contract.idContract}>
                                                    #{contract.idContract} — {contract.reservation?.client?.nameCli} {contract.reservation?.client?.surnameCli} — {currency(contract.finalValue)} {pendingLabel}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {isInstallmentMode ? (
                                    <>
                                        <div className="form-group">
                                            <label>Cantidad de cuotas del saldo</label>
                                            <input
                                                type="number"
                                                name="installmentsCount"
                                                value={createForm.installmentsCount}
                                                onChange={handleCreateChange}
                                                min="1"
                                                max="60"
                                                step="1"
                                                required
                                            />
                                            <small>La seña se registra aparte como Cuota #1.</small>
                                        </div>

                                        <div className="form-group">
                                            <label>Interés fijo ($)</label>
                                            <input
                                                type="number"
                                                name="interest"
                                                value={createForm.interest}
                                                onChange={handleCreateChange}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Primer vencimiento</label>
                                            <input
                                                type="date"
                                                name="firstDueDate"
                                                value={createForm.firstDueDate}
                                                onChange={handleCreateChange}
                                                required
                                            />
                                            <small>Las cuotas siguientes vencen mes a mes.</small>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Concepto</label>
                                            <input
                                                type="text"
                                                name="concept"
                                                value={createForm.concept}
                                                onChange={handleCreateChange}
                                                placeholder="Seña, Saldo, Cuota..."
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Monto</label>
                                            <input
                                                type="number"
                                                name="value"
                                                value={createForm.value}
                                                onChange={handleCreateChange}
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Vencimiento</label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={createForm.dueDate}
                                                onChange={handleCreateChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Estado</label>
                                            <select
                                                name="statusPayment"
                                                value={createForm.statusPayment}
                                                onChange={handleCreateChange}
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="seña">Seña abonada</option>
                                                <option value="pagado">Pagado</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Fecha de pago</label>
                                            <input
                                                type="date"
                                                name="datePayment"
                                                value={createForm.datePayment}
                                                onChange={handleCreateChange}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group full-width">
                                    <label>Notas</label>
                                    <textarea
                                        name="notes"
                                        value={createForm.notes}
                                        onChange={handleCreateChange}
                                        placeholder="Observaciones opcionales..."
                                    />
                                </div>
                            </div>

                            {isInstallmentMode && selectedContract && (
                                <div className="payment-installment-summary">
                                    <div>
                                        <span>Valor final</span>
                                        <strong>{currency(selectedFinalValue)}</strong>
                                    </div>
                                    <div>
                                        <span>Seña</span>
                                        <strong>{currency(estimatedDeposit)}</strong>
                                    </div>
                                    <div>
                                        <span>Interés</span>
                                        <strong>{currency(installmentInterest)}</strong>
                                    </div>
                                    <div>
                                        <span>Total con interés</span>
                                        <strong>{currency(installmentTotal)}</strong>
                                    </div>
                                    <div>
                                        <span>Saldo a dividir</span>
                                        <strong>{currency(installmentRemaining)}</strong>
                                    </div>
                                    <div>
                                        <span>Valor aprox. por cuota</span>
                                        <strong>{currency(installmentValue)}</strong>
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer-right">
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={() => setCreating(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit-cyan" disabled={saving}>
                                    {saving
                                        ? isInstallmentMode
                                            ? "Generando..."
                                            : "Guardando..."
                                        : isInstallmentMode
                                            ? "Generar cuotas"
                                            : "Crear pago"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editing && (
                <div className="modal-backdrop">
                    <div className="modal-card-form">
                        <div className="modal-header-styled">
                            <h2>Editar pago</h2>
                            <button className="btn-close" onClick={() => setEditing(null)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="modal-edit-form">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Contrato</label>
                                    <input type="text" value={`#${editing.idContract}`} disabled />
                                </div>

                                <div className="form-group">
                                    <label>Concepto</label>
                                    <input
                                        type="text"
                                        name="concept"
                                        value={editing.concept || ""}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Monto</label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={editing.value || ""}
                                        onChange={handleEditChange}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Vencimiento</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={editing.dueDate || ""}
                                        onChange={handleEditChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Estado</label>
                                    <select
                                        name="statusPayment"
                                        value={editing.statusPayment}
                                        onChange={handleEditChange}
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="seña">Seña abonada</option>
                                        <option value="pagado">Pagado</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Notas</label>
                                    <textarea
                                        name="notes"
                                        value={editing.notes || ""}
                                        onChange={handleEditChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer-right">
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={() => setEditing(null)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit-cyan" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleting && (
                <div className="modal-backdrop">
                    <div className="modal-card-j">
                        <div className="modal-body-j">
                            <div className="modal-content-j">
                                <p className="modal-text-j">
                                    ¿Eliminar el pago pendiente #{deleting.idPayment} del contrato #{deleting.idContract}?
                                </p>
                                <button
                                    type="button"
                                    className="btn-j-danger"
                                    onClick={handleDelete}
                                    disabled={saving}
                                >
                                    {saving ? "Eliminando..." : "Eliminar pago"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={() => setDeleting(null)}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {settingsOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card-form payment-settings-modal">
                        <div className="modal-header-styled">
                            <h2>Configuración de pagos</h2>
                            <button className="btn-close" onClick={() => setSettingsOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="modal-edit-form">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Porcentaje de seña (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={settingsForm.depositPercentage}
                                        onChange={(event) =>
                                            setSettingsForm((prev) => ({
                                                ...prev,
                                                depositPercentage: event.target.value
                                            }))
                                        }
                                        required
                                    />
                                    <small>
                                        Se usa al generar contratos para dividir el valor final en Seña + Saldo.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Días de anticipación del recordatorio</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="365"
                                        step="1"
                                        value={settingsForm.reminderDaysBeforeEvent}
                                        onChange={(event) =>
                                            setSettingsForm((prev) => ({
                                                ...prev,
                                                reminderDaysBeforeEvent: event.target.value
                                            }))
                                        }
                                        required
                                    />
                                    <small>
                                        El cron envía recordatorios a los pagos pendientes de eventos que ocurren en X días.
                                    </small>
                                </div>

                                <div className="form-group full-width">
                                    <label className="payment-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(settingsForm.remindersEnabled)}
                                            onChange={(event) =>
                                                setSettingsForm((prev) => ({
                                                    ...prev,
                                                    remindersEnabled: event.target.checked
                                                }))
                                            }

                                        />
                                        Recordatorios automáticos activados
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer-right">
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={() => setSettingsOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit-cyan" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar configuración"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reportDetail && (
                <div className="modal-backdrop">
                    <div className="modal-card-form payment-report-modal">
                        <div className="modal-header-styled">
                            <h2>Reporte de pago</h2>
                            <button className="btn-close" onClick={() => setReportDetail(null)}>✕</button>
                        </div>

                        <div className="modal-detail-grid">
                            <div className="detail-item">
                                <label>Contrato</label>
                                <span>#{reportDetail.idContract}</span>
                            </div>
                            <div className="detail-item">
                                <label>Cliente</label>
                                <span>{clientName(reportDetail)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Concepto</label>
                                <span>{reportDetail.concept || "Cuota"}</span>
                            </div>
                            <div className="detail-item">
                                <label>Monto</label>
                                <span>{currency(reportDetail.value)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Fecha informada</label>
                                <span>{formatDate(reportDetail.reportedPaymentDate)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Medio de pago</label>
                                <span>{reportDetail.reportedMethod || "—"}</span>
                            </div>
                            <div className="detail-item">
                                <label>Referencia</label>
                                <span>{reportDetail.reportedReference || "—"}</span>
                            </div>
                            <div className="detail-item">
                                <label>Estado del reporte</label>
                                <span>
                                    {REPORT_STATUS_LABEL[reportDetail.reportStatus] || "—"}
                                </span>
                            </div>
                            <div className="detail-item full-width">
                                <label>Notas del cliente</label>
                                <span>{reportDetail.reportedNotes || "—"}</span>
                            </div>
                            <div className="detail-item full-width">
                                <label>Comprobante</label>
                                <span>
                                    {reportDetail.reportedProofUrl ? (
                                        <a
                                            href={buildAssetUrl(reportDetail.reportedProofUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="payment-proof-link"
                                        >
                                            Ver comprobante adjunto
                                        </a>
                                    ) : (
                                        "Sin comprobante"
                                    )}
                                </span>
                            </div>
                            {reportDetail.reportReviewNotes && (
                                <div className="detail-item full-width">
                                    <label>Notas de revisión</label>
                                    <span>{reportDetail.reportReviewNotes}</span>
                                </div>
                            )}
                        </div>

                        {reportDetail.reportStatus === "pendiente" && (
                            <div className="payment-report-review">
                                {reportRejecting ? (
                                    <div className="form-group full-width">
                                        <label>Motivo del rechazo</label>
                                        <textarea
                                            value={reportRejectReason}
                                            onChange={(event) =>
                                                setReportRejectReason(event.target.value)
                                            }
                                            placeholder="Explicá por qué no se puede confirmar el pago..."
                                            rows={4}
                                            required
                                        />
                                    </div>
                                ) : null}

                                <div className="modal-footer-right">
                                    {reportRejecting ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-j-link-secondary"
                                                onClick={() => setReportRejecting(false)}
                                                disabled={reportSaving}
                                            >
                                                Volver
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-j-danger"
                                                onClick={handleRejectReport}
                                                disabled={reportSaving}
                                            >
                                                {reportSaving ? "Rechazando..." : "Confirmar rechazo"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-j-link-secondary"
                                                onClick={() => setReportDetail(null)}
                                                disabled={reportSaving}
                                            >
                                                Cerrar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-j-danger"
                                                onClick={() => setReportRejecting(true)}
                                                disabled={reportSaving}
                                            >
                                                Rechazar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-submit-cyan"
                                                onClick={handleConfirmReport}
                                                disabled={reportSaving}
                                            >
                                                {reportSaving ? "Confirmando..." : "Confirmar pago"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {reportDetail.reportStatus !== "pendiente" && (
                            <div className="modal-footer-right">
                                <button
                                    className="btn-j-primary"
                                    onClick={() => setReportDetail(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {emailTemplatesOpen && emailTemplates && (
                <div className="modal-backdrop">
                    <div className="modal-card-form payment-email-modal">
                        <div className="modal-header-styled">
                            <h2>Mensajes de email</h2>
                            <button className="btn-close" onClick={() => setEmailTemplatesOpen(false)}>✕</button>
                        </div>

                        <div className="payment-template-tabs">
                            {TEMPLATE_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    className={`payment-template-tab ${activeTemplate === tab.value ? "active" : ""}`}
                                    onClick={() => setActiveTemplate(tab.value)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSaveTemplates} className="modal-edit-form">
                            <div className="form-group">
                                <label>Asunto</label>
                                <input
                                    type="text"
                                    value={emailTemplates[activeTemplate]?.subject || ""}
                                    onChange={(event) =>
                                        handleTemplateChange("subject", event.target.value)
                                    }
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mensaje</label>
                                <textarea
                                    value={emailTemplates[activeTemplate]?.body || ""}
                                    onChange={(event) =>
                                        handleTemplateChange("body", event.target.value)
                                    }
                                    rows={12}
                                    required
                                />
                            </div>

                            <div className="payment-template-placeholders">
                                <span>Placeholders disponibles:</span>
                                <div>
                                    {(emailTemplates.placeholders || []).map((placeholder) => (
                                        <code key={placeholder}>{placeholder}</code>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer-right">
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={handleResetTemplates}
                                    disabled={templateSaving}
                                >
                                    Restaurar predeterminadas
                                </button>
                                <button
                                    type="button"
                                    className="btn-j-link-secondary"
                                    onClick={() => setEmailTemplatesOpen(false)}
                                    disabled={templateSaving}
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit-cyan"
                                    disabled={templateSaving}
                                >
                                    {templateSaving ? "Guardando..." : "Guardar plantillas"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {feedback && (
                <FeedbackModal
                    type={feedback.type}
                    title={feedback.title}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}
        </div>
    );
}

export default PaymentList;
