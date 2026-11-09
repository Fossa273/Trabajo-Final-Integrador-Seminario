import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma.js";
import {
    buildDemoEmail,
    isLegacyDemoEmail,
    readDemoEmails,
    trackDemoEmails,
    clearDemoEmails
} from "./demoEmail.js";

const DEMO_PASSWORD = "demo123";
const NAMES = [
    "Lucía",
    "Mateo",
    "Sofía",
    "Valentina",
    "Joaquín",
    "Martina",
    "Santiago",
    "Camila",
    "Benjamín",
    "Julieta",
    "Agustín",
    "Florencia"
];
const SURNAMES = [
    "Gómez",
    "Rodríguez",
    "Fernández",
    "López",
    "Martínez",
    "Pérez",
    "Sosa",
    "Romero",
    "Díaz",
    "Álvarez",
    "Torres",
    "Ruiz"
];
const METHODS = ["Transferencia", "Efectivo", "Mercado Pago", "Tarjeta"];

function parseArgs(argv) {
    const args = argv.slice(2);

    const readOption = (name) => {
        const withEquals = args.find((arg) => arg.startsWith(`--${name}=`));
        if (withEquals) return withEquals.slice(name.length + 3);

        const index = args.indexOf(`--${name}`);
        if (index >= 0) return args[index + 1];

        return undefined;
    };

    const clientsRaw = Number(readOption("clients") ?? 10);
    const seedRaw = readOption("seed");

    return {
        clients: Number.isInteger(clientsRaw) && clientsRaw > 0
            ? Math.min(clientsRaw, 100)
            : 10,
        seed: seedRaw ? Number(seedRaw) : Date.now(),
        reset: args.includes("--reset") || args.includes("--reset-only"),
        resetOnly: args.includes("--reset-only")
    };
}

function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6d2b79f5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
}

function createRandom(seed) {
    const next = mulberry32(seed);

    return {
        int(min, max) {
            return Math.floor(next() * (max - min + 1)) + min;
        },
        pick(list) {
            return list[Math.floor(next() * list.length)];
        },
        chance(probability) {
            return next() < probability;
        }
    };
}

function dateOnly(date) {
    const result = new Date(date);
    result.setHours(12, 0, 0, 0);
    return result;
}

function randomDate(random, minDays, maxDays) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + random.int(minDays, maxDays));
    return date;
}

function round(value) {
    return Math.round(Number(value) * 100) / 100;
}

async function resetDemoData() {
    const trackedEmails = new Set(
        (await readDemoEmails()).map((email) => email.toLowerCase())
    );

    const clients = await prisma.client.findMany({
        select: { idCli: true, emailCli: true }
    });
    const demoClients = clients.filter((client) =>
        trackedEmails.has(String(client.emailCli).toLowerCase()) ||
        isLegacyDemoEmail(client.emailCli)
    );
    const clientIds = demoClients.map((client) => client.idCli);

    const users = await prisma.usuario.findMany({
        where: {
            OR: [
                { idCli: { in: clientIds } },
                { username: { contains: "+stylo" } },
                { username: { endsWith: "@demo.stylo.test" } }
            ]
        },
        select: { idUsuario: true }
    });
    const userIds = users.map((user) => user.idUsuario);

    const reservations = clientIds.length
        ? await prisma.reservation.findMany({
            where: { idCli: { in: clientIds } },
            select: { idReservation: true }
        })
        : [];
    const reservationIds = reservations.map((reservation) => reservation.idReservation);

    const contracts = reservationIds.length
        ? await prisma.contract.findMany({
            where: { idReservation: { in: reservationIds } },
            select: { idContract: true }
        })
        : [];
    const contractIds = contracts.map((contract) => contract.idContract);

    await prisma.notification.deleteMany({
        where: {
            OR: [
                { idUsuario: { in: userIds } },
                { idContract: { in: contractIds } }
            ]
        }
    });
    await prisma.payment.deleteMany({ where: { idContract: { in: contractIds } } });
    await prisma.contractExtraService.deleteMany({
        where: { idContract: { in: contractIds } }
    });
    await prisma.contract.deleteMany({ where: { idContract: { in: contractIds } } });
    await prisma.reservationExtraService.deleteMany({
        where: { idReservation: { in: reservationIds } }
    });
    await prisma.reservation.deleteMany({
        where: { idReservation: { in: reservationIds } }
    });
    await prisma.usuario.deleteMany({ where: { idUsuario: { in: userIds } } });
    await prisma.client.deleteMany({ where: { idCli: { in: clientIds } } });
    await clearDemoEmails();

    return {
        clients: clientIds.length,
        contracts: contractIds.length
    };
}

async function createDemoData({ clients: clientsCount, seed }, random) {
    const locations = await prisma.location.findMany({
        where: { activo: true },
        select: { idLocation: true }
    });
    const loungeTypes = await prisma.loungeType.findMany({
        where: { activo: true, lounge: { activo: true } },
        select: {
            idLoungeType: true,
            idLounge: true,
            minQuantity: true,
            maxQuantity: true
        }
    });
    const cardDetails = await prisma.cardDetail.findMany({
        where: { activo: true },
        select: { idCardDetail: true }
    });

    if (!locations.length || !loungeTypes.length) {
        throw new Error(
            "Faltan localidades o salones. Ejecutá primero npm run seed:all."
        );
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const createdClients = [];

    for (let index = 0; index < clientsCount; index += 1) {
        const nameCli = random.pick(NAMES);
        const surnameCli = random.pick(SURNAMES);
        let emailCli = buildDemoEmail({ name: nameCli, surname: surnameCli });
        let emailSuffix = 1;

        while (
            await prisma.usuario.findUnique({ where: { username: emailCli } })
        ) {
            emailSuffix += 1;
            emailCli = buildDemoEmail({
                name: nameCli,
                surname: surnameCli,
                suffix: emailSuffix
            });
        }
        const location = random.pick(locations);
        const loungeType = random.pick(loungeTypes);
        const eventDate = randomDate(random, 15, 240);
        const reservationDate = randomDate(random, -90, -1);
        const cantInvit = random.int(
            loungeType.minQuantity,
            loungeType.maxQuantity
        );

        const client = await prisma.client.create({
            data: {
                nameCli,
                surnameCli,
                phoneCli: `341${random.int(1000000, 9999999)}`,
                dniCli: random.int(20000000, 49999999),
                addressCli: `Calle ${random.int(100, 9999)} ${random.int(1, 80)}`,
                emailCli,
                idLocation: location.idLocation
            }
        });

        await prisma.usuario.create({
            data: {
                username: emailCli,
                password: hashedPassword,
                rol: "cliente",
                idCli: client.idCli,
                passwordTemporal: false
            }
        });

        const reservationStatus = random.pick([
            "confirmada",
            "confirmada",
            "aceptada",
            "pendiente"
        ]);

        const reservation = await prisma.reservation.create({
            data: {
                dateReservation: dateOnly(reservationDate),
                dateEvent: dateOnly(eventDate),
                status: reservationStatus,
                eventType: random.pick([
                    "Casamiento",
                    "Cumpleaños de 15",
                    "Evento corporativo",
                    "Aniversario"
                ]),
                cantInvit,
                maxCantInvit: loungeType.maxQuantity,
                idCli: client.idCli,
                idLounge: loungeType.idLounge,
                idLoungeType: loungeType.idLoungeType,
                idCardDetail: cardDetails.length
                    ? random.pick(cardDetails).idCardDetail
                    : null
            }
        });

        const finalValue = round(random.int(900, 4200) * 1000);
        const contractStatus = reservationStatus === "pendiente"
            ? random.pick(["generado", "en_revision"])
            : random.pick(["firmado", "firmado", "aprobado", "generado"]);

        const contract = await prisma.contract.create({
            data: {
                eventStartTime: new Date("1970-01-01T20:00:00.000Z"),
                eventEndTime: new Date("1970-01-01T04:00:00.000Z"),
                dateContract: dateOnly(reservationDate),
                finalValue,
                status: contractStatus,
                cantExactaInvit: cantInvit,
                idReservation: reservation.idReservation
            }
        });

        const depositValue = round(finalValue * 0.3);
        const balanceValue = round(finalValue - depositValue);
        const dueDate = dateOnly(
            new Date(eventDate.getTime() - random.int(5, 20) * 86400000)
        );
        const scenario = random.int(1, 10);
        const depositPaid = scenario >= 5;
        const balancePaid = scenario === 7 || scenario === 8;
        const reported = scenario === 9 || scenario === 10;
        const rejected = scenario === 6 && random.chance(0.35);

        await prisma.payment.create({
            data: {
                value: depositValue,
                statusPayment: depositPaid ? "seña" : "pendiente",
                datePayment: depositPaid
                    ? dateOnly(randomDate(random, -60, -10))
                    : dateOnly(new Date()),
                concept: "Seña",
                dueDate,
                idContract: contract.idContract
            }
        });

        const reportedPaymentDate = dateOnly(randomDate(random, -20, -1));
        const reportStatus = reported
            ? "pendiente"
            : rejected
                ? "rechazado"
                : null;

        await prisma.payment.create({
            data: {
                value: balanceValue,
                statusPayment: balancePaid ? "pagado" : "pendiente",
                datePayment: balancePaid
                    ? dateOnly(randomDate(random, -30, -1))
                    : dateOnly(new Date()),
                concept: "Saldo",
                dueDate,
                reportedAt: reportStatus ? new Date() : null,
                reportedPaymentDate: reportStatus ? reportedPaymentDate : null,
                reportedMethod: reportStatus ? random.pick(METHODS) : null,
                reportedReference: reportStatus
                    ? `OP-${random.int(100000, 999999)}`
                    : null,
                reportedNotes: reportStatus
                    ? "Aviso de pago generado por el seed aleatorio."
                    : null,
                reportStatus,
                reportReviewedAt:
                    reportStatus === "rechazado" ? new Date() : null,
                reportReviewNotes:
                    reportStatus === "rechazado"
                        ? "El comprobante no coincide con el monto informado."
                        : null,
                idContract: contract.idContract
            }
        });

        createdClients.push({ emailCli, contractId: contract.idContract });
    }

    await trackDemoEmails(createdClients.map((client) => client.emailCli));

    return createdClients;
}

async function main() {
    const options = parseArgs(process.argv);
    const random = createRandom(options.seed);

    console.log(`Seed aleatorio: ${options.seed}`);

    if (options.resetOnly) {
        const removed = await resetDemoData();
        console.log(
            `Datos demo eliminados: ${removed.clients} clientes, ${removed.contracts} contratos.`
        );
        await prisma.$disconnect();
        return;
    }

    if (options.reset) {
        const removed = await resetDemoData();
        console.log(
            `Datos demo previos eliminados: ${removed.clients} clientes, ${removed.contracts} contratos.`
        );
    }

    const created = await createDemoData(options, random);

    console.log(`Clientes demo creados: ${created.length}.`);
    console.log(`Contraseña para todos: ${DEMO_PASSWORD}`);
    console.log(`Ejemplo de acceso: ${created[0]?.emailCli}`);

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error("Error al generar datos aleatorios:", error.message);
    await prisma.$disconnect();
    process.exit(1);
});
