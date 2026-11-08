const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
});

export const PAYMENT_EMAIL_KEYS = {
    PENDING: "payment_pending",
    REMINDER: "payment_reminder",
    CONFIRMED: "payment_confirmed"
};

const EMAIL_META = {
    [PAYMENT_EMAIL_KEYS.PENDING]: {
        title: "Pago pendiente",
        message: "se registró un pago pendiente para tu evento."
    },
    [PAYMENT_EMAIL_KEYS.REMINDER]: {
        title: "Recordatorio de pago",
        message: "te recordamos que tenés un pago pendiente para tu evento."
    },
    [PAYMENT_EMAIL_KEYS.CONFIRMED]: {
        title: "Pago confirmado",
        message: "confirmamos que registramos tu pago para tu evento."
    }
};

export const DEFAULT_PAYMENT_EMAIL_TEMPLATES = {
    [PAYMENT_EMAIL_KEYS.PENDING]: {
        subject: "Pago pendiente registrado - Contrato #{{contrato}}",
        body: [
            "Hola {{cliente}},",
            "",
            "{{mensaje}}",
            "",
            "Contrato: #{{contrato}}",
            "Concepto: {{concepto}}",
            "Monto: {{monto}}",
            "Vencimiento: {{vencimiento}}",
            "Fecha del evento: {{fechaEvento}}",
            "Salón: {{salon}}",
            "",
            "Podés revisar el estado de tus pagos en: {{enlace}}"
        ].join("\n")
    },
    [PAYMENT_EMAIL_KEYS.REMINDER]: {
        subject: "Recordatorio de pago pendiente - Contrato #{{contrato}}",
        body: [
            "Hola {{cliente}},",
            "",
            "{{mensaje}}",
            "",
            "Contrato: #{{contrato}}",
            "Concepto: {{concepto}}",
            "Monto: {{monto}}",
            "Vencimiento: {{vencimiento}}",
            "Fecha del evento: {{fechaEvento}}",
            "Salón: {{salon}}",
            "",
            "Podés revisar el estado de tus pagos en: {{enlace}}"
        ].join("\n")
    },
    [PAYMENT_EMAIL_KEYS.CONFIRMED]: {
        subject: "Pago confirmado - Contrato #{{contrato}}",
        body: [
            "Hola {{cliente}},",
            "",
            "{{mensaje}}",
            "",
            "Contrato: #{{contrato}}",
            "Concepto: {{concepto}}",
            "Monto: {{monto}}",
            "Fecha de pago: {{fechaPago}}",
            "",
            "Podés revisar el estado de tus pagos en: {{enlace}}"
        ].join("\n")
    }
};

export const PAYMENT_EMAIL_PLACEHOLDERS = [
    "{{cliente}}",
    "{{contrato}}",
    "{{concepto}}",
    "{{monto}}",
    "{{vencimiento}}",
    "{{fechaEvento}}",
    "{{fechaPago}}",
    "{{salon}}",
    "{{enlace}}",
    "{{titulo}}",
    "{{mensaje}}"
];

function formatCurrency(value) {
    return CURRENCY_FORMATTER.format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "Sin fecha definida";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha definida";
    return date.toLocaleDateString("es-AR");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function replacePlaceholders(template, values) {
    return String(template || "").replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(values, key)
            ? String(values[key] ?? "")
            : match;
    });
}

export function buildPaymentEmail({ kind, payment, contract, template }) {
    const key = Object.values(PAYMENT_EMAIL_KEYS).includes(kind)
        ? kind
        : PAYMENT_EMAIL_KEYS.PENDING;
    const defaults = DEFAULT_PAYMENT_EMAIL_TEMPLATES[key];
    const meta = EMAIL_META[key];
    const selectedTemplate = {
        subject: template?.subject || defaults.subject,
        body: template?.body || defaults.body
    };

    const client = contract?.reservation?.client;
    const lounge = contract?.reservation?.lounge;
    const loungeType = contract?.reservation?.loungeType;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const contractId = contract?.idContract;
    const concept = payment?.concept || "Cuota";
    const amount = formatCurrency(payment?.value);
    const dueDate = formatDate(payment?.dueDate);
    const eventDate = formatDate(contract?.reservation?.dateEvent);
    const paymentDate = formatDate(payment?.datePayment);
    const loungeName = [lounge?.name, loungeType?.nameLoungeType]
        .filter(Boolean)
        .join(" - ") || "Sin salón definido";
    const link = `${frontendUrl}/contract/${contractId}`;

    const values = {
        cliente: client?.nameCli || "cliente",
        contrato: contractId,
        concepto: concept,
        monto: amount,
        vencimiento: dueDate,
        fechaEvento: eventDate,
        fechaPago: paymentDate,
        salon: loungeName,
        enlace: link,
        titulo: meta.title,
        mensaje: meta.message
    };

    const subject = replacePlaceholders(selectedTemplate.subject, values)
        .replace(/[\r\n]+/g, " ")
        .trim();
    const text = replacePlaceholders(selectedTemplate.body, values).trim();
    const htmlBody = escapeHtml(text).replace(/\n/g, "<br />");

    const html = `
        <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #ffffff; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #141a2e; border: 1px solid #2b3552; border-radius: 16px; padding: 28px;">
                <h1 style="margin: 0 0 12px; font-size: 22px; color: #67e8f9;">${escapeHtml(meta.title)}</h1>
                <div style="margin: 0 0 20px; color: #d7def0; line-height: 1.6;">
                    ${htmlBody}
                </div>
                <a href="${escapeHtml(link)}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #22d3ee; color: #0b0f19; text-decoration: none; font-weight: bold;">
                    Ver mi contrato
                </a>
                <p style="margin: 24px 0 0; color: #7f8aa3; font-size: 12px;">Salon STYLO</p>
            </div>
        </div>
    `;

    return { subject, text, html };
}

export function buildPendingPaymentEmail({ payment, contract, template }) {
    return buildPaymentEmail({
        kind: PAYMENT_EMAIL_KEYS.PENDING,
        payment,
        contract,
        template
    });
}

export function buildPaymentReminderEmail({ payment, contract, template }) {
    return buildPaymentEmail({
        kind: PAYMENT_EMAIL_KEYS.REMINDER,
        payment,
        contract,
        template
    });
}

export function buildConfirmedPaymentEmail({ payment, contract, template }) {
    return buildPaymentEmail({
        kind: PAYMENT_EMAIL_KEYS.CONFIRMED,
        payment,
        contract,
        template
    });
}
