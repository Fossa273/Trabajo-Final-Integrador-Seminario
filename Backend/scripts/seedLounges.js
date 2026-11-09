import prisma from "../src/lib/prisma.js";

const LOUNGES = [
    {
        name: "Stylo Funes",
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
        name: "Stylo Roldán",
        loungeAddress: "Av Pellegrini 3124",
        city: "Rosario",
        types: [
            { nameLoungeType: "Grande", minQuantity: 90, maxQuantity: 130 },
            { nameLoungeType: "Chico", minQuantity: 70, maxQuantity: 90 }
        ]
    },
    {
        name: "Stylo Palermo",
        loungeAddress: "Av. Santa Fe 3253",
        city: "Buenos Aires",
        types: [
            { nameLoungeType: "Imperial", minQuantity: 120, maxQuantity: 200 },
            { nameLoungeType: "Ejecutivo", minQuantity: 60, maxQuantity: 120 }
        ]
    },
    {
        name: "Stylo La Plata",
        loungeAddress: "Calle 50 1234",
        city: "La Plata",
        types: [
            { nameLoungeType: "Clásico", minQuantity: 80, maxQuantity: 140 }
        ]
    },
    {
        name: "Stylo Córdoba",
        loungeAddress: "Av. Colón 567",
        city: "Córdoba",
        types: [
            { nameLoungeType: "Premium", minQuantity: 100, maxQuantity: 180 },
            { nameLoungeType: "Íntimo", minQuantity: 40, maxQuantity: 80 }
        ]
    },
    {
        name: "Stylo Mendoza",
        loungeAddress: "San Martín 890",
        city: "Mendoza",
        types: [
            { nameLoungeType: "Reserva", minQuantity: 50, maxQuantity: 100 }
        ]
    },
    {
        name: "Stylo Belgrano",
        loungeAddress: "Av. Cabildo 2230",
        city: "Buenos Aires",
        types: [
            { nameLoungeType: "Imperial", minQuantity: 120, maxQuantity: 200 },
            { nameLoungeType: "Ejecutivo", minQuantity: 60, maxQuantity: 120 }
        ]
    },
    {
        name: "Stylo San Isidro",
        loungeAddress: "Av. Centenario 1450",
        city: "San Isidro",
        types: [
            { nameLoungeType: "Clásico", minQuantity: 80, maxQuantity: 140 },
            { nameLoungeType: "Íntimo", minQuantity: 40, maxQuantity: 80 }
        ]
    },
    {
        name: "Stylo Tigre",
        loungeAddress: "Av. Liniers 890",
        city: "Tigre",
        types: [
            { nameLoungeType: "Premium", minQuantity: 100, maxQuantity: 180 }
        ]
    },
    {
        name: "Stylo Mar del Plata",
        loungeAddress: "Av. Luro 2750",
        city: "Mar del Plata",
        types: [
            { nameLoungeType: "Grande", minQuantity: 90, maxQuantity: 130 },
            { nameLoungeType: "Chico", minQuantity: 70, maxQuantity: 90 }
        ]
    },
    {
        name: "Stylo Santa Fe",
        loungeAddress: "Av. Litoral 780",
        city: "Santa Fe",
        types: [
            { nameLoungeType: "Reina", minQuantity: 52, maxQuantity: 123 }
        ]
    },
    {
        name: "Stylo Salta",
        loungeAddress: "Caseros 720",
        city: "Salta",
        types: [
            { nameLoungeType: "Princesa", minQuantity: 100, maxQuantity: 150 }
        ]
    },
    {
        name: "Stylo Tucumán",
        loungeAddress: "Av. Aconquija 1200",
        city: "San Miguel de Tucumán",
        types: [
            { nameLoungeType: "Clásico", minQuantity: 80, maxQuantity: 140 }
        ]
    },
    {
        name: "Stylo Neuquén",
        loungeAddress: "Av. Argentina 420",
        city: "Neuquén",
        types: [
            { nameLoungeType: "Ejecutivo", minQuantity: 60, maxQuantity: 120 }
        ]
    },
    {
        name: "Stylo Bariloche",
        loungeAddress: "Av. Bustillo 9500",
        city: "San Carlos de Bariloche",
        types: [
            { nameLoungeType: "Premium", minQuantity: 100, maxQuantity: 180 },
            { nameLoungeType: "Reserva", minQuantity: 50, maxQuantity: 100 }
        ]
    },
    {
        name: "Stylo Bahía Blanca",
        loungeAddress: "Av. Alem 1350",
        city: "Bahía Blanca",
        types: [
            { nameLoungeType: "Grande", minQuantity: 90, maxQuantity: 130 }
        ]
    },
    {
        name: "Stylo Corrientes",
        loungeAddress: "Junín 640",
        city: "Corrientes",
        types: [
            { nameLoungeType: "Íntimo", minQuantity: 40, maxQuantity: 80 }
        ]
    },
    {
        name: "Stylo San Juan",
        loungeAddress: "Av. Ignacio de la Roza 1100",
        city: "San Juan",
        types: [
            { nameLoungeType: "Reina", minQuantity: 52, maxQuantity: 123 }
        ]
    },
    {
        name: "Stylo Paraná",
        loungeAddress: "Av. Ramírez 980",
        city: "Paraná",
        types: [
            { nameLoungeType: "Clásico", minQuantity: 80, maxQuantity: 140 }
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