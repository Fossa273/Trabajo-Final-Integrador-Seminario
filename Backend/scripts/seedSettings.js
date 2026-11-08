import prisma from "../src/lib/prisma.js";

const DEFAULT_SETTINGS = [
    { key: "payment_deposit_percentage", value: "30" },
    { key: "payment_reminder_days_before_event", value: "7" },
    { key: "payment_reminders_enabled", value: "true" }
];

async function seed() {
    for (const setting of DEFAULT_SETTINGS) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting
        });

        console.log(`Configuración "${setting.key}" lista.`);
    }

    console.log("Seed de configuración finalizado.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar configuración:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
