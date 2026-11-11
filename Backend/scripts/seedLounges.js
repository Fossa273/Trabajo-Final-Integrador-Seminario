import prisma from "../src/lib/prisma.js";

const LOUNGES = [
    {
        name: "Stylo Rosario",
        loungeAddress: "Av Pellegrini 31",
        city: "Rosario",
        types: [
            { nameLoungeType: "Reina", minQuantity: 52, maxQuantity: 123 }
        ]
    },
    {
        name: "Stylo zona norte",
        loungeAddress: "Urquiza 3455",
        city: "Rosario",
        types: [
            { nameLoungeType: "Princesa", minQuantity: 100, maxQuantity: 150 }
        ]
    },
    {
        name: "Stylo Rosario Centro",
        loungeAddress: "Av Pellegrini 3124",
        city: "Rosario",
        types: [
            { nameLoungeType: "Grande", minQuantity: 90, maxQuantity: 130 },
            { nameLoungeType: "Chico", minQuantity: 70, maxQuantity: 90 }
        ]
    }
];

async function seed() {
    let createdLounges = 0;
    let createdTypes = 0;
    let skippedLounges = 0;
    let skippedTypes = 0;

    for (const item of LOUNGES) {
        const location = await prisma.location.findFirst({
            where: { city: item.city }
        });

        if (!location) {
            console.log(`  - No existe la localidad "${item.city}" para el salón "${item.name}". Ejecutá primero seedLocations.js`);
            continue;
        }

        let lounge = await prisma.lounge.findFirst({
            where: { name: item.name }
        });

        if (!lounge) {
            lounge = await prisma.lounge.create({
                data: {
                    name: item.name,
                    loungeAddress: item.loungeAddress,
                    idLocation: location.idLocation
                }
            });
            createdLounges++;
        } else {
            skippedLounges++;
        }

        for (const type of item.types) {
            const existing = await prisma.loungeType.findFirst({
                where: {
                    idLounge: lounge.idLounge,
                    nameLoungeType: type.nameLoungeType
                }
            });

            if (existing) {
                skippedTypes++;
                continue;
            }

            await prisma.loungeType.create({
                data: {
                    nameLoungeType: type.nameLoungeType,
                    minQuantity: type.minQuantity,
                    maxQuantity: type.maxQuantity,
                    idLounge: lounge.idLounge
                }
            });
            createdTypes++;
        }
    }

    console.log(
        `Seed de salones finalizado: ${createdLounges} salones creados, ${skippedLounges} ya existían; ${createdTypes} tipos creados, ${skippedTypes} ya existían.`
    );

    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar salones:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});