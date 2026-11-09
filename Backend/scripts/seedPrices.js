import prisma from "../src/lib/prisma.js";

const PRICE_BY_TYPE = {
    Reina: 1200000,
    Princesa: 1500000,
    Grande: 1300000,
    Chico: 900000
};

const EFFECTIVE_DATES = [
    { date: "2026-01-01", endDate: null, factor: 1 }
];

async function seed() {
    const loungeTypes = await prisma.loungeType.findMany({
        where: {
            activo: true,
            lounge: { activo: true },
            nameLoungeType: { in: Object.keys(PRICE_BY_TYPE) }
        },
        orderBy: { idLoungeType: "asc" },
        select: { idLoungeType: true, nameLoungeType: true }
    });

    const loungeTypeByName = new Map();
    for (const loungeType of loungeTypes) {
        if (!loungeTypeByName.has(loungeType.nameLoungeType)) {
            loungeTypeByName.set(loungeType.nameLoungeType, loungeType);
        }
    }

    const expectedPrices = [];
    for (const [nameLoungeType, baseValue] of Object.entries(PRICE_BY_TYPE)) {
        const loungeType = loungeTypeByName.get(nameLoungeType);
        if (!loungeType) {
            console.log(`  - No existe el tipo de salón "${nameLoungeType}".`);
            continue;
        }

        for (const item of EFFECTIVE_DATES) {
            expectedPrices.push({
                effectiveDate: new Date(`${item.date}T00:00:00.000Z`),
                endDate: item.endDate
                    ? new Date(`${item.endDate}T00:00:00.000Z`)
                    : null,
                value: Math.round(baseValue * item.factor),
                idLoungeType: loungeType.idLoungeType
            });
        }
    }

    if (expectedPrices.length === 0) {
        console.log("Seed de precios omitido: no se encontraron tipos de salón.");
        await prisma.$disconnect();
        process.exit(0);
    }

    const deleted = await prisma.price.deleteMany({
        where: {
            NOT: {
                OR: expectedPrices.map(({ effectiveDate, idLoungeType }) => ({
                    effectiveDate,
                    idLoungeType
                }))
            }
        }
    });

    let inserted = 0;
    let skipped = 0;

    for (const price of expectedPrices) {
        const existing = await prisma.price.findUnique({
            where: {
                effectiveDate_idLoungeType: {
                    effectiveDate: price.effectiveDate,
                    idLoungeType: price.idLoungeType
                }
            }
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.price.create({ data: price });
        inserted++;
    }

    console.log(
        `Seed de precios finalizado: ${inserted} insertados, ${skipped} omitidos, ${deleted.count} eliminados.`
    );

    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar precios:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
