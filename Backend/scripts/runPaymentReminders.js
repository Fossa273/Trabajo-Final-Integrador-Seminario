import prisma from "../src/lib/prisma.js";
import paymentService from "../src/services/payment.service.js";

async function run() {
    const result = await paymentService.runAutomaticReminders();

    console.log("Proceso de recordatorios finalizado:", result);

    await prisma.$disconnect();
    process.exit(0);
}

run().catch(async (error) => {
    console.error("Error al ejecutar los recordatorios:", error.message);
    await prisma.$disconnect();
    process.exit(1);
});
