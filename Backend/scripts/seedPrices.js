import prisma from "../src/lib/prisma.js";

const PRICE_BY_TYPE = {
    Reina: 1200000,
    Princesa: 1500000,
    Grande: 1300000,
    Chico: 900000,
    Imperial: 2100000,
    Ejecutivo: 1600000,
    "Clásico": 1400000,
    Premium: 2000000,
    "Íntimo": 1000000,
    Reserva: 1250000
};

const DEFAULT_PRICE = 1200000;

const EFFECTIVE_DATES = [
    { date: "2026-01-01", endDate: "2026-06-30", factor: 1 },
    { date: "2026-07-01", endDate: null, factor: 1.1 }
];

async function seed() {
    const loungeTypes = await prisma.loungeType.findMany({
        where: { activo: true, lounge: { activo: true } },
        select: { idLoungeType: true, nameLoungeType: true }
    });

    let inserted = 0;
    let skipped = 0;

    for (const loungeType of loungeTypes) {
        const baseValue =
            PRICE_BY_TYPE[loungeType.nameLoungeType] ?? DEFAULT_PRICE;

        for (const item of EFFECTIVE_DATES) {
            const effectiveDate = new Date(`${item.date}T00:00:00.000Z`);
            const existing = await prisma.price.findUnique({
                where: {
                    effectiveDate_idLoungeType: {
                        effectiveDate,
                        idLoungeType: loungeType.idLoungeType
                    }
                }
            });

            if (existing) {
                skipped++;
                continue;
            }

            await prisma.price.create({
                data: {
                    effectiveDate,
                    endDate: item.endDate
                        ? new Date(`${item.endDate}T00:00:00.000Z`)
                        : null,
                    value: Math.round(baseValue * item.factor),
                    idLoungeType: loungeType.idLoungeType
                }
            });
            inserted++;
        }
    }

    console.log(
        `Seed de precios finalizado: ${inserted} insertados, ${skipped} omitidos en ${loungeTypes.length} tipos de salón.`
    );

    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar precios:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
