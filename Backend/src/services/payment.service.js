import paymentModel from "../models/payment.model.js";
import contractModel from "../models/contract.model.js";
import settingService from "./setting.service.js";
import emailTemplateService from "./emailTemplate.service.js";
import notificationService from "./notification.service.js";
import mailService from "./mail.service.js";
import {
    buildPaymentEmail,
    PAYMENT_EMAIL_KEYS
} from "../utils/paymentEmailTemplates.js";
import httpError from "../utils/httpError.js";

export const PAYMENT_STATUS = {
    PENDING: "pendiente",
    DEPOSIT: "seña",
    PAID: "pagado"
};

export const PAYMENT_REPORT_STATUS = {
    PENDING: "pendiente",
    CONFIRMED: "confirmado",
    REJECTED: "rechazado"
};

const ALLOWED_STATUS = Object.values(PAYMENT_STATUS);
const PAID_STATUSES = [PAYMENT_STATUS.DEPOSIT, PAYMENT_STATUS.PAID];
const MAX_REPORT_METHOD_LENGTH = 50;
const MAX_REPORT_REFERENCE_LENGTH = 100;
const MAX_REPORT_NOTES_LENGTH = 500;

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
});

function round(value) {
    return Math.round(Number(value) * 100) / 100;
}

function formatCurrency(value) {
    return CURRENCY_FORMATTER.format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "sin fecha de vencimiento";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "sin fecha de vencimiento";
    return date.toLocaleDateString("es-AR");
}

function parseReportDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function todayAtStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function normalizeReportText(value, maxLength, label, { required = false } = {}) {
    const text = String(value ?? "").trim();

    if (required && !text) {
        throw httpError(400, `Indicá ${label}.`);
    }

    if (text.length > maxLength) {
        throw httpError(
            400,
            `${label} no puede superar los ${maxLength} caracteres.`
        );
    }

    return text || null;
}

function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function isSameDay(a, b) {
    if (!a || !b) return false;
    const first = new Date(a);
    const second = new Date(b);
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function isDeposit(payment) {
    return normalizeText(payment.concept).includes("sena");
}

function isBalance(payment) {
    return normalizeText(payment.concept).includes("saldo");
}

function isAdjustment(payment) {
    return normalizeText(payment.concept).includes("ajuste");
}

function hasPendingReport(payment) {
    return payment?.reportStatus === PAYMENT_REPORT_STATUS.PENDING;
}

function getContractId(payment) {
    return payment?.contract?.idContract ?? payment?.idContract;
}

function getClient(payment) {
    return payment?.contract?.reservation?.client || null;
}

function getClientName(payment) {
    const client = getClient(payment);
    if (!client) return "el cliente";
    return `${client.nameCli || ""} ${client.surnameCli || ""}`.trim() || "el cliente";
}

class PaymentService {

    async getAll() {
        return await paymentModel.getAll();
    }

    async getById(id) {
        const payment = await paymentModel.getById(id);

        if (!payment || !payment.activo) {
            throw httpError(404, "Pago no encontrado.");
        }

        return payment;
    }

    async getByContract(idContract) {
        const contract = await contractModel.getById(idContract);

        if (!contract) {
            throw httpError(404, "El contrato indicado no existe.");
        }

        return await paymentModel.getByContract(idContract);
    }

    async reportPayment(id, report, usuario) {
        const payment = await this.getById(id);
        const client = getClient(payment);

        if (
            !usuario?.idCli ||
            Number(client?.idCli) !== Number(usuario.idCli)
        ) {
            throw httpError(403, "No podés informar pagos de otro cliente.");
        }

        if (payment.statusPayment !== PAYMENT_STATUS.PENDING) {
            throw httpError(400, "Solo se pueden informar pagos pendientes.");
        }

        if (payment.reportStatus === PAYMENT_REPORT_STATUS.PENDING) {
            throw httpError(
                400,
                "Este pago ya fue informado y está pendiente de confirmación."
            );
        }

        const rawPaymentDate = report.reportedPaymentDate ?? report.datePayment;
        const reportedPaymentDate = rawPaymentDate
            ? parseReportDate(rawPaymentDate)
            : todayAtStart();

        if (!reportedPaymentDate) {
            throw httpError(400, "La fecha de pago informada no es válida.");
        }

        if (reportedPaymentDate > todayAtStart()) {
            throw httpError(400, "La fecha de pago no puede ser futura.");
        }

        const reportedMethod = normalizeReportText(
            report.reportedMethod ?? report.method,
            MAX_REPORT_METHOD_LENGTH,
            "el medio de pago",
            { required: true }
        );
        const reportedReference = normalizeReportText(
            report.reportedReference ?? report.reference,
            MAX_REPORT_REFERENCE_LENGTH,
            "la referencia"
        );
        const reportedNotes = normalizeReportText(
            report.reportedNotes ?? report.notes,
            MAX_REPORT_NOTES_LENGTH,
            "las notas"
        );

        const updated = await paymentModel.reportPayment(id, {
            reportedPaymentDate,
            reportedMethod,
            reportedReference,
            reportedNotes,
            reportedProofUrl: report.reportedProofUrl || null
        });

        const contractId = getContractId(updated);
        const concept = updated.concept || "Cuota";
        const amount = formatCurrency(updated.value);
        const clientName = getClientName(updated);

        try {
            await notificationService.notifyAdmins({
                mensaje: `El cliente ${clientName} informó el pago "${concept}" del contrato #${contractId} por ${amount}.`,
                tipo: "pago_informado",
                idContract: contractId
            });
            await notificationService.notifyClient({
                idCli: getClient(updated)?.idCli,
                mensaje: `Recibimos tu aviso de pago "${concept}" del contrato #${contractId} por ${amount}. Queda pendiente de confirmación.`,
                tipo: "pago_informado",
                idContract: contractId
            });
        } catch (error) {
            console.error(
                "[PAYMENT] No se pudieron crear las notificaciones del reporte:",
                error.message
            );
        }

        return updated;
    }

    async confirmReport(id, data = {}) {
        const payment = await this.getById(id);

        if (payment.reportStatus !== PAYMENT_REPORT_STATUS.PENDING) {
            throw httpError(400, "El pago no tiene un reporte pendiente.");
        }

        const statusPayment =
            data.statusPayment ||
            (isDeposit(payment) ? PAYMENT_STATUS.DEPOSIT : PAYMENT_STATUS.PAID);

        if (
            !ALLOWED_STATUS.includes(statusPayment) ||
            statusPayment === PAYMENT_STATUS.PENDING
        ) {
            throw httpError(400, "Estado de pago inválido para confirmar.");
        }

        const reportReviewNotes = normalizeReportText(
            data.reportReviewNotes,
            MAX_REPORT_NOTES_LENGTH,
            "las notas de revisión"
        );

        const updated = await paymentModel.confirmReport(id, {
            statusPayment,
            datePayment: payment.reportedPaymentDate || todayAtStart(),
            reportReviewNotes
        });

        await this.notifyConfirmedPayment(updated);

        return updated;
    }

    async rejectReport(id, data = {}) {
        const payment = await this.getById(id);

        if (payment.reportStatus !== PAYMENT_REPORT_STATUS.PENDING) {
            throw httpError(400, "El pago no tiene un reporte pendiente.");
        }

        const reason = normalizeReportText(
            data.reason ?? data.reportReviewNotes,
            MAX_REPORT_NOTES_LENGTH,
            "el motivo del rechazo",
            { required: true }
        );

        const updated = await paymentModel.rejectReport(id, reason);

        try {
            await notificationService.notifyClient({
                idCli: getClient(updated)?.idCli,
                mensaje: `Tu aviso de pago del contrato #${getContractId(updated)} fue rechazado: ${reason}. Podés volver a informarlo.`,
                tipo: "pago_rechazado",
                idContract: getContractId(updated)
            });
        } catch (error) {
            console.error(
                "[PAYMENT] No se pudo notificar el rechazo del reporte:",
                error.message
            );
        }

        return updated;
    }

    async getReportedCount() {
        return await paymentModel.countReported();
    }

    async create(payment) {
        const value = Number(payment.value);

        if (!Number.isFinite(value) || value <= 0) {
            throw httpError(400, "El valor del pago debe ser un número mayor a 0.");
        }

        if (!payment.idContract) {
            throw httpError(400, "Indicá el contrato asociado al pago.");
        }

        const contract = await contractModel.getById(payment.idContract);

        if (!contract) {
            throw httpError(404, "El contrato indicado no existe.");
        }

        const statusPayment = payment.statusPayment || PAYMENT_STATUS.PENDING;

        if (!ALLOWED_STATUS.includes(statusPayment)) {
            throw httpError(400, "Estado de pago inválido.");
        }

        const created = await paymentModel.create({
            value,
            statusPayment,
            datePayment: payment.datePayment || new Date(),
            concept: payment.concept,
            dueDate: payment.dueDate,
            notes: payment.notes,
            idContract: payment.idContract
        });

        if (statusPayment === PAYMENT_STATUS.PENDING) {
            await this.notifyPendingPayment(created);
        } else {
            await this.notifyConfirmedPayment(created);
        }

        return created;
    }

    async update(id, payment) {
        const existing = await this.getById(id);

        if (
            payment.statusPayment !== undefined &&
            !ALLOWED_STATUS.includes(payment.statusPayment)
        ) {
            throw httpError(400, "Estado de pago inválido.");
        }

        if (payment.value !== undefined) {
            const value = Number(payment.value);
            if (!Number.isFinite(value) || value < 0) {
                throw httpError(400, "El valor del pago debe ser un número mayor o igual a 0.");
            }
        }

        const nextStatus = payment.statusPayment || existing.statusPayment;
        const patch = { ...payment };

        if (
            payment.statusPayment !== undefined &&
            nextStatus !== PAYMENT_STATUS.PENDING &&
            payment.datePayment === undefined
        ) {
            patch.datePayment = new Date();
        }

        if (
            existing.reportStatus === PAYMENT_REPORT_STATUS.PENDING &&
            PAID_STATUSES.includes(nextStatus)
        ) {
            patch.reportStatus = PAYMENT_REPORT_STATUS.CONFIRMED;
            patch.reportReviewedAt = new Date();
        }

        const updated = await paymentModel.update(id, patch);

        if (!updated) {
            throw httpError(400, "No se pudo actualizar el pago.");
        }

        const becamePending =
            nextStatus === PAYMENT_STATUS.PENDING &&
            existing.statusPayment !== PAYMENT_STATUS.PENDING;
        const becamePaid =
            PAID_STATUSES.includes(nextStatus) &&
            !PAID_STATUSES.includes(existing.statusPayment);

        if (becamePending) {
            await this.notifyPendingPayment(updated);
        } else if (becamePaid) {
            await this.notifyConfirmedPayment(updated);
        }

        return updated;
    }

    async delete(id) {
        const existing = await this.getById(id);

        if (existing.statusPayment !== PAYMENT_STATUS.PENDING) {
            throw httpError(
                400,
                "Solo se pueden eliminar pagos pendientes. Los pagos abonados se conservan como historial."
            );
        }

        if (existing.reportStatus === PAYMENT_REPORT_STATUS.PENDING) {
            throw httpError(
                400,
                "No se puede eliminar un pago con un reporte pendiente. Rechazá el reporte primero."
            );
        }

        const deleted = await paymentModel.delete(id);

        if (!deleted) {
            throw httpError(400, "No se pudo eliminar el pago.");
        }

        return true;
    }

    async getPendingCount() {
        return await paymentModel.countPending();
    }

    async sendReminder(id, { automatic = false } = {}) {
        const payment = await this.getById(id);

        if (payment.statusPayment !== PAYMENT_STATUS.PENDING) {
            if (automatic) {
                return { sent: false, reason: "not_pending" };
            }
            throw httpError(400, "Solo se pueden recordar pagos pendientes.");
        }

        if (payment.reportStatus === PAYMENT_REPORT_STATUS.PENDING) {
            if (automatic) {
                return { sent: false, reason: "reported_pending" };
            }
            throw httpError(
                400,
                "El pago fue informado por el cliente y está pendiente de confirmación."
            );
        }

        if (automatic && isSameDay(payment.lastReminderAt, new Date())) {
            return { sent: false, reason: "already_sent_today" };
        }

        await this.notifyReminder(payment);
        await paymentModel.markReminderSent(payment.idPayment);

        return { sent: true };
    }

    async runAutomaticReminders() {
        const settings = await settingService.getPaymentSettings();

        if (!settings.remindersEnabled) {
            return {
                processed: 0,
                sent: 0,
                skipped: 0,
                reason: "disabled"
            };
        }

        const targetDate = addDays(
            startOfDay(new Date()),
            settings.reminderDaysBeforeEvent
        );
        const start = startOfDay(targetDate);
        const end = addDays(start, 1);

        const payments = await paymentModel.getPendingForReminder(start, end);

        let sent = 0;
        let skipped = 0;

        for (const payment of payments) {
            const result = await this.sendReminder(payment.idPayment, {
                automatic: true
            });

            if (result.sent) {
                sent += 1;
            } else {
                skipped += 1;
            }
        }

        return {
            processed: payments.length,
            sent,
            skipped,
            reminderDaysBeforeEvent: settings.reminderDaysBeforeEvent
        };
    }

    async syncContractPayments(idContract, finalValue) {
        const value = round(finalValue);

        if (!Number.isFinite(value) || value < 0) return;

        const contract = await contractModel.getById(idContract);
        const eventDate = contract?.reservation?.dateEvent || null;

        const payments = await paymentModel.getByContract(idContract);
        const paidPayments = payments.filter((p) =>
            PAID_STATUSES.includes(p.statusPayment)
        );
        const pendingPayments = payments.filter(
            (p) => p.statusPayment === PAYMENT_STATUS.PENDING
        );
        const paidTotal = round(
            paidPayments.reduce((acc, p) => acc + Number(p.value), 0)
        );

        if (paidTotal > 0) {
            const remaining = round(Math.max(0, value - paidTotal));
            const unreportedPending = pendingPayments.filter(
                (payment) => !hasPendingReport(payment)
            );
            const target =
                unreportedPending.find(isBalance) ||
                unreportedPending.find(isAdjustment) ||
                unreportedPending[0] ||
                pendingPayments[0];

            if (remaining > 0) {
                if (target) {
                    await paymentModel.update(target.idPayment, {
                        value: remaining
                    });

                    for (const payment of pendingPayments) {
                        if (
                            payment.idPayment !== target.idPayment &&
                            !hasPendingReport(payment)
                        ) {
                            await paymentModel.delete(payment.idPayment);
                        }
                    }
                } else {
                    await paymentModel.create({
                        value: remaining,
                        statusPayment: PAYMENT_STATUS.PENDING,
                        datePayment: new Date(),
                        concept: "Ajuste",
                        dueDate: eventDate,
                        idContract
                    });
                }
            } else {
                for (const payment of pendingPayments) {
                    if (!hasPendingReport(payment)) {
                        await paymentModel.delete(payment.idPayment);
                    }
                }
            }

            return;
        }

        const depositPayment = pendingPayments.find(isDeposit);
        const balancePayment = pendingPayments.find(isBalance);
        const depositPercentage = await settingService.getDepositPercentage();
        const depositAmount = round((value * depositPercentage) / 100);

        if (depositPayment && balancePayment) {
            if (depositAmount <= 0) {
                if (!hasPendingReport(depositPayment)) {
                    await paymentModel.delete(depositPayment.idPayment);
                }
                await paymentModel.update(balancePayment.idPayment, {
                    value
                });
            } else if (depositAmount >= value) {
                await paymentModel.update(depositPayment.idPayment, {
                    value
                });
                if (!hasPendingReport(balancePayment)) {
                    await paymentModel.delete(balancePayment.idPayment);
                }
            } else {
                await paymentModel.update(depositPayment.idPayment, {
                    value: depositAmount
                });
                await paymentModel.update(balancePayment.idPayment, {
                    value: round(value - depositAmount)
                });
            }
            return;
        }

        if (balancePayment) {
            const otherTotal = round(
                pendingPayments
                    .filter((p) => p.idPayment !== balancePayment.idPayment)
                    .reduce((acc, p) => acc + Number(p.value), 0)
            );

            await paymentModel.update(balancePayment.idPayment, {
                value: round(Math.max(0, value - otherTotal))
            });
            return;
        }

        if (depositPayment) {
            const safeDeposit = round(Math.min(depositAmount, value));

            if (safeDeposit <= 0) {
                await paymentModel.update(depositPayment.idPayment, {
                    value
                });
            } else {
                await paymentModel.update(depositPayment.idPayment, {
                    value: safeDeposit
                });

                if (safeDeposit < value) {
                    await paymentModel.create({
                        value: round(value - safeDeposit),
                        statusPayment: PAYMENT_STATUS.PENDING,
                        datePayment: new Date(),
                        concept: "Saldo",
                        dueDate: eventDate,
                        idContract
                    });
                }
            }
            return;
        }

        if (pendingPayments.length === 1) {
            await paymentModel.update(pendingPayments[0].idPayment, {
                value
            });
            return;
        }

        if (pendingPayments.length > 1) {
            const [first, ...rest] = pendingPayments;
            const restTotal = round(
                rest.reduce((acc, p) => acc + Number(p.value), 0)
            );

            await paymentModel.update(first.idPayment, {
                value: round(Math.max(0, value - restTotal))
            });
            return;
        }

        if (value > 0) {
            await paymentModel.create({
                value,
                statusPayment: PAYMENT_STATUS.PENDING,
                datePayment: new Date(),
                concept: "Saldo",
                dueDate: eventDate,
                idContract
            });
        }
    }

    async getSettings() {
        return await settingService.getPaymentSettings();
    }

    async updateSettings(data) {
        return await settingService.updatePaymentSettings(data);
    }

    async getEmailTemplates() {
        return await emailTemplateService.getPaymentTemplates();
    }

    async updateEmailTemplates(data) {
        return await emailTemplateService.updatePaymentTemplates(data);
    }

    async resetEmailTemplates() {
        return await emailTemplateService.resetPaymentTemplates();
    }

    async notifyPendingPayment(payment) {
        const contractId = getContractId(payment);
        const concept = payment.concept || "Cuota";
        const amount = formatCurrency(payment.value);
        const dueDate = formatDate(payment.dueDate);
        const clientName = getClientName(payment);

        try {
            await notificationService.notifyAdmins({
                mensaje: `Pago pendiente en el contrato #${contractId}: ${concept} por ${amount} (${clientName}). Vence: ${dueDate}.`,
                tipo: "pago_pendiente",
                idContract: contractId
            });
            await notificationService.notifyClient({
                idCli: getClient(payment)?.idCli,
                mensaje: `Se registró un pago pendiente del contrato #${contractId}: ${concept} por ${amount}. Vence: ${dueDate}.`,
                tipo: "pago_pendiente",
                idContract: contractId
            });
        } catch (error) {
            console.error(
                "[PAYMENT] No se pudieron crear las notificaciones:",
                error.message
            );
        }

        await this.sendPaymentEmail(payment, "pending");
    }

    async notifyConfirmedPayment(payment) {
        const contractId = getContractId(payment);
        const concept = payment.concept || "Cuota";
        const amount = formatCurrency(payment.value);

        try {
            await notificationService.notifyAdmins({
                mensaje: `Se registró el pago "${concept}" del contrato #${contractId} por ${amount}.`,
                tipo: "pago_confirmado",
                idContract: contractId
            });
            await notificationService.notifyClient({
                idCli: getClient(payment)?.idCli,
                mensaje: `Se registró el pago "${concept}" del contrato #${contractId} por ${amount}.`,
                tipo: "pago_confirmado",
                idContract: contractId
            });
        } catch (error) {
            console.error(
                "[PAYMENT] No se pudieron crear las notificaciones:",
                error.message
            );
        }

        await this.sendPaymentEmail(payment, "confirmed");
    }

    async notifyReminder(payment) {
        const contractId = getContractId(payment);
        const concept = payment.concept || "Cuota";
        const amount = formatCurrency(payment.value);
        const dueDate = formatDate(payment.dueDate);
        const clientName = getClientName(payment);

        try {
            await notificationService.notifyAdmins({
                mensaje: `Recordatorio enviado: ${concept} del contrato #${contractId} por ${amount} (${clientName}). Vence: ${dueDate}.`,
                tipo: "pago_recordatorio",
                idContract: contractId
            });
            await notificationService.notifyClient({
                idCli: getClient(payment)?.idCli,
                mensaje: `Recordatorio: el pago "${concept}" del contrato #${contractId} por ${amount} sigue pendiente. Vence: ${dueDate}.`,
                tipo: "pago_recordatorio",
                idContract: contractId
            });
        } catch (error) {
            console.error(
                "[PAYMENT] No se pudieron crear las notificaciones:",
                error.message
            );
        }

        await this.sendPaymentEmail(payment, "reminder");
    }

    async sendPaymentEmail(payment, kind) {
        const client = getClient(payment);

        if (!client?.emailCli) {
            return { sent: false, reason: "missing_email" };
        }

        if (!mailService.isConfigured()) {
            return { sent: false, reason: "not_configured" };
        }

        const key =
            kind === "reminder"
                ? PAYMENT_EMAIL_KEYS.REMINDER
                : kind === "confirmed"
                    ? PAYMENT_EMAIL_KEYS.CONFIRMED
                    : PAYMENT_EMAIL_KEYS.PENDING;
        const savedTemplate = await emailTemplateService.getTemplateByKey(key);
        const template = buildPaymentEmail({
            kind: key,
            payment,
            contract: payment.contract,
            template: savedTemplate
        });

        return await mailService.sendMail({
            to: client.emailCli,
            ...template
        });
    }
}

export default new PaymentService();
