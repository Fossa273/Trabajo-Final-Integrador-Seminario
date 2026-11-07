import emailTemplateModel from "../models/emailTemplate.model.js";
import {
    DEFAULT_PAYMENT_EMAIL_TEMPLATES,
    PAYMENT_EMAIL_KEYS,
    PAYMENT_EMAIL_PLACEHOLDERS
} from "../utils/paymentEmailTemplates.js";
import httpError from "../utils/httpError.js";

const UI_KIND_TO_KEY = {
    pending: PAYMENT_EMAIL_KEYS.PENDING,
    reminder: PAYMENT_EMAIL_KEYS.REMINDER,
    confirmed: PAYMENT_EMAIL_KEYS.CONFIRMED
};

const KEY_TO_UI_KIND = {
    [PAYMENT_EMAIL_KEYS.PENDING]: "pending",
    [PAYMENT_EMAIL_KEYS.REMINDER]: "reminder",
    [PAYMENT_EMAIL_KEYS.CONFIRMED]: "confirmed"
};

const MAX_SUBJECT_LENGTH = 255;
const MAX_BODY_LENGTH = 10000;

function normalizeTemplate(template) {
    const subject = String(template?.subject ?? "").trim();
    const body = String(template?.body ?? "").trim();

    if (!subject) {
        throw httpError(400, "El asunto del email es obligatorio.");
    }

    if (subject.length > MAX_SUBJECT_LENGTH) {
        throw httpError(
            400,
            `El asunto del email no puede superar los ${MAX_SUBJECT_LENGTH} caracteres.`
        );
    }

    if (!body) {
        throw httpError(400, "El mensaje del email es obligatorio.");
    }

    if (body.length > MAX_BODY_LENGTH) {
        throw httpError(
            400,
            `El mensaje del email no puede superar los ${MAX_BODY_LENGTH} caracteres.`
        );
    }

    return { subject, body };
}

class EmailTemplateService {

    async getPaymentTemplates() {
        const rows = await emailTemplateModel.getAll();
        const map = new Map(rows.map((row) => [row.key, row]));
        const result = {};

        for (const [kind, key] of Object.entries(UI_KIND_TO_KEY)) {
            const defaults = DEFAULT_PAYMENT_EMAIL_TEMPLATES[key];
            const saved = map.get(key);

            result[kind] = {
                key,
                subject: saved?.subject || defaults.subject,
                body: saved?.body || defaults.body
            };
        }

        result.placeholders = PAYMENT_EMAIL_PLACEHOLDERS;
        return result;
    }

    async getTemplateByKey(key) {
        const defaults = DEFAULT_PAYMENT_EMAIL_TEMPLATES[key];

        if (!defaults) return null;

        const saved = await emailTemplateModel.getByKey(key);

        return {
            key,
            subject: saved?.subject || defaults.subject,
            body: saved?.body || defaults.body
        };
    }

    async updatePaymentTemplates(data = {}) {
        for (const [kind, key] of Object.entries(UI_KIND_TO_KEY)) {
            if (data[kind] === undefined) continue;

            const template = normalizeTemplate(data[kind]);
            await emailTemplateModel.upsert(key, template);
        }

        return await this.getPaymentTemplates();
    }

    async resetPaymentTemplates() {
        for (const [key, template] of Object.entries(DEFAULT_PAYMENT_EMAIL_TEMPLATES)) {
            await emailTemplateModel.upsert(key, template);
        }

        return await this.getPaymentTemplates();
    }

    kindFromKey(key) {
        return KEY_TO_UI_KIND[key] || null;
    }
}

export default new EmailTemplateService();
