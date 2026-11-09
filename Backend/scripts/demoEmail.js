import prisma from "../src/lib/prisma.js";

// Los emails demo tienen formato nombre.apellido@gmail.com. Como ese formato
// es indistinguible de un email real, los clientes demo se registran en la
// tabla Setting para poder identificarlos y limpiarlos sin alterar el email.
export const DEMO_EMAIL_SETTING_PREFIX = "demo_email_";
export const LEGACY_DEMO_TAG = "+stylo";
export const LEGACY_DEMO_DOMAIN = "@demo.stylo.test";

const EMAIL_DOMAIN = "gmail.com";

export function slugifyName(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "");
}

export function buildDemoEmail({ name, surname, suffix = "" }) {
    const local = `${slugifyName(name)}.${slugifyName(surname)}${suffix}`;
    return `${local}@${EMAIL_DOMAIN}`;
}

export function isLegacyDemoEmail(email) {
    const value = String(email ?? "").toLowerCase();
    return value.includes(LEGACY_DEMO_TAG) || value.endsWith(LEGACY_DEMO_DOMAIN);
}

export async function trackDemoEmails(emails) {
    const unique = [...new Set(
        emails
            .map((email) => String(email ?? "").toLowerCase())
            .filter(Boolean)
    )];

    for (const email of unique) {
        await prisma.setting.upsert({
            where: { key: `${DEMO_EMAIL_SETTING_PREFIX}${email}` },
            update: {},
            create: {
                key: `${DEMO_EMAIL_SETTING_PREFIX}${email}`,
                value: "1"
            }
        });
    }
}

export async function readDemoEmails() {
    const rows = await prisma.setting.findMany({
        where: { key: { startsWith: DEMO_EMAIL_SETTING_PREFIX } },
        select: { key: true }
    });

    return rows.map((row) =>
        row.key.slice(DEMO_EMAIL_SETTING_PREFIX.length)
    );
}

export async function clearDemoEmails() {
    await prisma.setting.deleteMany({
        where: { key: { startsWith: DEMO_EMAIL_SETTING_PREFIX } }
    });
}
