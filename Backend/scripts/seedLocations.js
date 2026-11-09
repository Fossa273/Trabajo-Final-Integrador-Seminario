import prisma from "../src/lib/prisma.js";

const locations = [
    { city: "Buenos Aires", zipCode: "1000" },
    { city: "La Plata", zipCode: "1900" },
    { city: "Córdoba", zipCode: "5000" },
    { city: "Rosario", zipCode: "2000" },
    { city: "Santa Fe", zipCode: "3000" },
    { city: "Mendoza", zipCode: "5500" },
    { city: "San Miguel de Tucumán", zipCode: "4000" },
    { city: "Salta", zipCode: "4400" },
    { city: "San Juan", zipCode: "5400" },
    { city: "Neuquén", zipCode: "8300" },
    { city: "Posadas", zipCode: "3300" },
    { city: "Paraná", zipCode: "3100" },
    { city: "Resistencia", zipCode: "3500" },
    { city: "Corrientes", zipCode: "3400" },
    { city: "San Salvador de Jujuy", zipCode: "4600" },
    { city: "San Luis", zipCode: "5700" },
    { city: "La Rioja", zipCode: "5300" },
    { city: "San Fernando del Valle de Catamarca", zipCode: "4700" },
    { city: "Río Gallegos", zipCode: "9400" },
    { city: "Ushuaia", zipCode: "9410" },
    { city: "Rawson", zipCode: "9103" },
    { city: "Viedma", zipCode: "8500" },
    { city: "Santa Rosa", zipCode: "6300" },
    { city: "Mar del Plata", zipCode: "7600" },
    { city: "Bahía Blanca", zipCode: "8000" },
    { city: "Tandil", zipCode: "7000" },
    { city: "San Nicolás", zipCode: "2900" },
    { city: "Campana", zipCode: "2804" },
    { city: "Zárate", zipCode: "2800" },
    { city: "Pilar", zipCode: "1629" },
    { city: "Tigre", zipCode: "1648" },
    { city: "San Isidro", zipCode: "1642" },
    { city: "Vicente López", zipCode: "1638" },
    { city: "Quilmes", zipCode: "1878" },
    { city: "Lanús", zipCode: "1824" },
    { city: "Avellaneda", zipCode: "1870" },
    { city: "Moreno", zipCode: "1744" },
    { city: "Morón", zipCode: "1708" },
    { city: "San Miguel", zipCode: "1663" },
    { city: "Azul", zipCode: "7300" },
    { city: "Olavarría", zipCode: "7400" },
    { city: "Pergamino", zipCode: "2700" },
    { city: "Junín", zipCode: "6000" },
    { city: "Chivilcoy", zipCode: "6620" },
    { city: "Mercedes", zipCode: "6600" },
    { city: "Luján", zipCode: "6700" },
    { city: "Dolores", zipCode: "7100" },
    { city: "Chascomús", zipCode: "7130" },
    { city: "Lobos", zipCode: "7240" },
    { city: "Nueve de Julio", zipCode: "6500" },
    { city: "Pehuajó", zipCode: "6450" },
    { city: "Trenque Lauquen", zipCode: "6400" },
    { city: "Lincoln", zipCode: "6070" },
    { city: "Río Cuarto", zipCode: "5800" },
    { city: "Villa María", zipCode: "5900" },
    { city: "San Francisco", zipCode: "2400" },
    { city: "Villa Carlos Paz", zipCode: "5152" },
    { city: "Alta Gracia", zipCode: "5186" },
    { city: "Rafaela", zipCode: "2300" },
    { city: "Venado Tuerto", zipCode: "2600" },
    { city: "Reconquista", zipCode: "3560" },
    { city: "Gualeguaychú", zipCode: "2820" },
    { city: "Concordia", zipCode: "3200" },
    { city: "Concepción del Uruguay", zipCode: "3260" },
    { city: "San Rafael", zipCode: "5600" },
    { city: "Godoy Cruz", zipCode: "5501" },
    { city: "Maipú", zipCode: "5515" },
    { city: "Comodoro Rivadavia", zipCode: "9000" },
    { city: "Trelew", zipCode: "9100" },
    { city: "Puerto Madryn", zipCode: "9120" },
    { city: "Esquel", zipCode: "9200" },
    { city: "Cutral Có", zipCode: "8322" },
    { city: "Zapala", zipCode: "8340" },
    { city: "San Martín de los Andes", zipCode: "8370" },
    { city: "San Carlos de Bariloche", zipCode: "8400" },
    { city: "Caleta Olivia", zipCode: "9011" },
    { city: "General Roca", zipCode: "8332" },
    { city: "Villa Mercedes", zipCode: "5730" },
    { city: "Río Tercero", zipCode: "5850" },
    { city: "San Pedro", zipCode: "2930" },
    { city: "Necochea", zipCode: "7630" },
    { city: "Tres Arroyos", zipCode: "7500" },
    { city: "Pigüé", zipCode: "8170" },
    { city: "Santa Teresita", zipCode: "7107" },
    { city: "Pinamar", zipCode: "7167" },
    { city: "Villa Gesell", zipCode: "7165" }
];

const normalize = (value) =>
    String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

async function seed() {
    const existing = await prisma.location.findMany({
        select: { city: true, zipCode: true }
    });
    const existingKeys = new Set(
        existing.map((row) => `${normalize(row.city)}|${String(row.zipCode)}`)
    );

    let inserted = 0;
    const duplicates = [];

    for (const location of locations) {
        const key = `${normalize(location.city)}|${String(location.zipCode)}`;
        if (existingKeys.has(key)) {
            duplicates.push(location.city);
            continue;
        }
        await prisma.location.create({
            data: { city: location.city, zipCode: location.zipCode }
        });
        existingKeys.add(key);
        inserted++;
    }

    console.log(
        `Seed de locations finalizado: ${inserted} insertadas, ${existing.length} ya existentes, ${duplicates.length} duplicadas.`
    );
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar locations:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
