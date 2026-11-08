import nodemailer from "nodemailer";

let transporter = null;

function buildTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
        auth: { user, pass }
    });
}

function getTransporter() {
    if (!transporter) {
        transporter = buildTransporter();
    }
    return transporter;
}

class MailService {

    isConfigured() {
        return Boolean(getTransporter() && process.env.MAIL_FROM);
    }

    async sendMail({ to, subject, html, text }) {
        const transport = getTransporter();

        if (!transport || !process.env.MAIL_FROM) {
            console.warn(
                "[MAIL] SMTP no configurado. Se omite el envío a:",
                to
            );
            return { sent: false, reason: "not_configured" };
        }

        if (!to) {
            return { sent: false, reason: "missing_recipient" };
        }

        try {
            const info = await transport.sendMail({
                from: process.env.MAIL_FROM,
                to,
                subject,
                html,
                text
            });

            return { sent: true, messageId: info.messageId };
        } catch (error) {
            console.error("[MAIL] Error al enviar el correo:", error.message);
            return { sent: false, reason: "send_failed", error: error.message };
        }
    }
}

export default new MailService();
