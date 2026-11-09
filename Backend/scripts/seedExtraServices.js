import prisma from "../src/lib/prisma.js";

const EXTRA_SERVICES = [
    {
        nameService: "DJ",
        detailService: "Servicio de música y animación durante el evento",
        cost: 50000.0
    },
    {
        nameService: "Fotografía",
        detailService: "Servicio de fotografía profesional durante el evento",
        cost: 40000.0
    },
    {
        nameService: "Decoración",
        detailService: "Decoración temática del salón",
        cost: 35000.0
    },
    {
        nameService: "Catering",
        detailService: "Servicio adicional de comida y bebidas",
        cost: 60000.0
    },
    {
        nameService: "Sonido e iluminación",
        detailService: "Equipamiento profesional de sonido e iluminación",
        cost: 45000.0
    },
    {
        nameService: "Pantalla y proyector",
        detailService: "Pantalla y proyector para presentaciones o videos",
        cost: 30000.0
    },
    {
        nameService: "Barra de tragos",
        detailService: "Bartender profesional y barra móvil con cócteles clásicos",
        cost: 75000.0
    },
    {
        nameService: "Torta de celebración",
        detailService: "Torta artesanal decorada según la temática del evento",
        cost: 55000.0
    },
    {
        nameService: "Cabina de fotos",
        detailService: "Cabina fotográfica con impresión ilimitada y accesorios",
        cost: 48000.0
    },
    {
        nameService: "Animación infantil",
        detailService: "Coordinadores recreativos y juegos para los más chicos",
        cost: 42000.0
    },
    {
        nameService: "Valet parking",
        detailService: "Servicio de estacionamiento con personal capacitado",
        cost: 38000.0
    },
    {
        nameService: "Pista de luces LED",
        detailService: "Iluminación LED programable para pista de baile",
        cost: 52000.0
    },
    {
        nameService: "Maestro de ceremonias",
        detailService: "Conducción profesional del evento y coordinación de momentos",
        cost: 65000.0
    },
    {
        nameService: "Show de fuegos artificiales",
        detailService: "Espectáculo pirotécnico frío para el cierre del evento",
        cost: 90000.0
    },
    {
        nameService: "Candy bar",
        detailService: "Mesa dulce con golosinas, macarons y chocolate artesanal",
        cost: 58000.0
    },
    {
        nameService: "Coffee break",
        detailService: "Estación de café de especialidad, té e infusiones con pastelería",
        cost: 34000.0
    },
    {
        nameService: "Guardarropas",
        detailService: "Servicio de guardarropas con personal durante todo el evento",
        cost: 28000.0
    },
    {
        nameService: "Cronometraje de invitados",
        detailService: "Recepción y acreditación digital de invitados con pulseras",
        cost: 36000.0
    },
    {
        nameService: "Dron y video 360",
        detailService: "Cobertura aérea y video inmersivo 360 del evento",
        cost: 72000.0
    },
    {
        nameService: "Sector de juegos",
        detailService: "Espacio recreativo con juegos de mesa gigantes y consolas",
        cost: 46000.0
    }
];

async function seed() {
    let inserted = 0;
    let skipped = 0;

    for (const svc of EXTRA_SERVICES) {
        const existing = await prisma.extraService.findFirst({
            where: { nameService: svc.nameService }
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.extraService.create({
            data: {
                nameService: svc.nameService,
                detailService: svc.detailService,
                cost: svc.cost
            }
        });
        inserted++;
    }

    console.log(
        `Seed de servicios extra finalizado: ${inserted} insertados, ${skipped} omitidos (ya existían).`
    );

    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar servicios extra:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});