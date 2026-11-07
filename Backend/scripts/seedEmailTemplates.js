import prisma from "../src/lib/prisma.js";
import { DEFAULT_PAYMENT_EMAIL_TEMPLATES } from "../src/utils/paymentEmailTemplates.js";

async function seed() {
    for (const [key, template] of Object.entries(DEFAULT_PAYMENT_EMAIL_TEMPLATES)) {
        await prisma.emailTemplate.upsert({
            where: { key },
            update: {},
            create: {
                key,
                subject: template.subject,
                body: template.body
            }
        });

        console.log(`Plantilla "${key}" lista.`);
    }

    console.log("Seed de plantillas de email finalizado.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar plantillas de email:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
