import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma.js";

const DEMO_DOMAIN = "@demo.stylo.test";
const DEMO_PASSWORD = "demo123";

const DEMO_CLIENTS = [
    { name: "Lucía", surname: "Gómez", city: "Rosario", phone: "3415551001", dni: 30111001 },
    { name: "Mateo", surname: "Rodríguez", city: "Buenos Aires", phone: "1145551002", dni: 30111002 },
    { name: "Sofía", surname: "Fernández", city: "La Plata", phone: "2215551003", dni: 30111003 },
    { name: "Valentina", surname: "López", city: "Córdoba", phone: "3515551004", dni: 30111004 },
    { name: "Joaquín", surname: "Martínez", city: "Mendoza", phone: "2615551005", dni: 30111005 },
    { name: "Martina", surname: "Pérez", city: "Rosario", phone: "3415551006", dni: 30111006 },
    { name: "Santiago", surname: "Sosa", city: "Santa Fe", phone: "3425551007", dni: 30111007 },
    { name: "Camila", surname: "Romero", city: "Buenos Aires", phone: "1145551008", dni: 30111008 },
    { name: "Benjamín", surname: "Díaz", city: "Córdoba", phone: "3515551009", dni: 30111009 },
    { name: "Julieta", surname: "Álvarez", city: "La Plata", phone: "2215551010", dni: 30111010 },
    { name: "Agustín", surname: "Torres", city: "Mendoza", phone: "2615551011", dni: 30111011 },
    { name: "Florencia", surname: "Ruiz", city: "Rosario", phone: "3415551012", dni: 30111012 }
];

const EVENT_TYPES = [
    "Casamiento",
    "Cumpleaños de 15",
    "Evento corporativo",
    "Aniversario",
    "Bautismo"
];

const METHODS = ["Transferencia", "Efectivo", "Mercado Pago", "Tarjeta"];

function dateOnly(value) {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    return date;
}

function addDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return dateOnly(date);
}

function addMonths(value, months) {
    const date = new Date(value);
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();
    date.setDate(Math.min(day, lastDay));
    return dateOnly(date);
}

function round(value) {
    return Math.round(Number(value) * 100) / 100;
}

function splitAmount(total, parts) {
    const totalCents = Math.round(Number(total) * 100);
    const base = Math.floor(totalCents / parts);
    const remainder = totalCents - base * parts;

    return Array.from({ length: parts }, (_, index) => {
        const cents = base + (index < remainder ? 1 : 0);
        return cents / 100;
    });
}

function reportFields(scenario, eventDate, index) {
    if (scenario === 2 || scenario === 7) {
        return {
            reportedAt: new Date(),
            reportedPaymentDate: addDays(new Date(), -(index + 1)),
            reportedMethod: METHODS[index % METHODS.length],
            reportedReference: `OP-${100000 + index}`,
            reportedNotes: "Comprobante cargado desde el seed de demo.",
            reportStatus: "pendiente",
            reportReviewedAt: null,
            reportReviewNotes: null
        };
    }

    if (scenario === 4) {
        return {
            reportedAt: new Date(),
            reportedPaymentDate: addDays(new Date(), -(index + 2)),
            reportedMethod: METHODS[index % METHODS.length],
            reportedReference: `OP-${200000 + index}`,
            reportedNotes: "Comprobante observado por el administrador.",
            reportStatus: "rechazado",
            reportReviewedAt: new Date(),
            reportReviewNotes: "El comprobante no coincide con el monto informado."
        };
    }

    return {
        reportedAt: null,
        reportedPaymentDate: null,
        reportedMethod: null,
        reportedReference: null,
        reportedNotes: null,
        reportStatus: null,
        reportReviewedAt: null,
        reportReviewNotes: null
    };
}

async function createPayment(data) {
    return await prisma.payment.create({ data });
}

async function createLegacyPayments(contract, finalValue, eventDate, scenario, index) {
    const depositValue = round(finalValue * 0.3);
    const balanceValue = round(finalValue - depositValue);
    const dueDate = addDays(eventDate, -10);
    const paymentDate = addDays(new Date(), -(index + 5));

    const depositPaid = ![2, 5].includes(scenario);
    const balancePaid = [1, 8].includes(scenario);
    const report = reportFields(scenario, eventDate, index);

    await createPayment({
        value: depositValue,
        statusPayment: depositPaid ? "seña" : "pendiente",
        datePayment: depositPaid ? paymentDate : dateOnly(new Date()),
        concept: "Seña",
        dueDate,
        notes: "Seña del contrato.",
        idContract: contract.idContract
    });

    if (scenario !== 5) {
        await createPayment({
            value: balanceValue,
            statusPayment: balancePaid ? "pagado" : "pendiente",
            datePayment: balancePaid ? paymentDate : dateOnly(new Date()),
            concept: "Saldo",
            dueDate: scenario === 9 ? addDays(new Date(), -15) : dueDate,
            notes: "Saldo restante del contrato.",
            ...report,
            idContract: contract.idContract
        });
    }
}

async function createInstallmentPayments(contract, finalValue, eventDate, scenario, index) {
    const depositValue = round(finalValue * 0.3);
    const remaining = round(finalValue - depositValue);
    const count = scenario === 10 ? 5 : 3;
    const amounts = splitAmount(remaining, count);
    const firstDueDate = addDays(new Date(), 15 + index);
    const paidInstallments = scenario === 10 ? 2 : 1;

    await createPayment({
        value: depositValue,
        statusPayment: "seña",
        datePayment: addDays(new Date(), -(index + 8)),
        concept: "Cuota #1",
        dueDate: addDays(eventDate, -30),
        notes: "Seña. Cuota inicial del plan.",
        idContract: contract.idContract
    });

    for (let i = 0; i < amounts.length; i += 1) {
        const number = i + 2;
        const isPaid = i < paidInstallments;
        let report = reportFields(-1, eventDate, index);

        if (!isPaid && i === paidInstallments) {
            if (scenario === 10) {
                report = reportFields(7, eventDate, index);
            } else if (scenario === 4) {
                report = reportFields(4, eventDate, index);
            }
        }

        await createPayment({
            value: amounts[i],
            statusPayment: isPaid ? "pagado" : "pendiente",
            datePayment: isPaid
                ? addDays(new Date(), -(index + i + 2))
                : dateOnly(new Date()),
            concept: `Cuota #${number}`,
            dueDate: addMonths(firstDueDate, i),
            notes: i === 0 ? "Interés aplicado: $0.00." : null,
            ...report,
            idContract: contract.idContract
        });
    }
}

async function createDemoData() {
    const locations = await prisma.location.findMany({
        where: { activo: true },
        select: { idLocation: true, city: true }
    });
    const loungeTypes = await prisma.loungeType.findMany({
        where: { activo: true, lounge: { activo: true } },
        select: {
            idLoungeType: true,
            idLounge: true,
            minQuantity: true,
            maxQuantity: true,
            nameLoungeType: true
        },
        orderBy: { idLoungeType: "asc" }
    });
    const cardDetails = await prisma.cardDetail.findMany({
        where: { activo: true },
        select: { idCardDetail: true },
        orderBy: { idCardDetail: "asc" }
    });
    const extraServices = await prisma.extraService.findMany({
        where: { activo: true },
        select: { idService: true, cost: true },
        orderBy: { idService: "asc" }
    });
    const admin = await prisma.usuario.findFirst({
        where: { rol: "administrador", activo: true },
        select: { idUsuario: true }
    });

    if (!locations.length || !loungeTypes.length) {
        throw new Error(
            "Faltan localidades o salones. Ejecutá primero npm run seed:all."
        );
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    let createdClients = 0;
    let createdContracts = 0;
    let createdPayments = 0;

    for (let index = 0; index < DEMO_CLIENTS.length; index += 1) {
        const item = DEMO_CLIENTS[index];
        const emailCli = `demo.${String(index + 1).padStart(2, "0")}${DEMO_DOMAIN}`;

        const existing = await prisma.client.findFirst({
            where: { emailCli },
            select: { idCli: true }
        });

        if (existing) {
            continue;
        }

        const location =
            locations.find((row) => row.city === item.city) || locations[0];
        const loungeType = loungeTypes[index % loungeTypes.length];
        const cardDetail = cardDetails.length
            ? cardDetails[index % cardDetails.length]
            : null;
        const eventDate = addDays(new Date(), 20 + index * 18);
        const reservationDate = addDays(new Date(), -(10 + index * 4));
        const cantInvit =
            loungeType.minQuantity +
            ((index * 7) % Math.max(1, loungeType.maxQuantity - loungeType.minQuantity));
        const scenario = index % 12;

        const client = await prisma.client.create({
            data: {
                nameCli: item.name,
                surnameCli: item.surname,
                phoneCli: item.phone,
                dniCli: item.dni,
                addressCli: `Calle ${100 + index * 13} ${20 + index}`,
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

        const reservation = await prisma.reservation.create({
            data: {
                dateReservation: reservationDate,
                dateEvent: eventDate,
                status: ["confirmada", "aceptada", "pendiente"][index % 3],
                eventType: EVENT_TYPES[index % EVENT_TYPES.length],
                cantInvit,
                maxCantInvit: loungeType.maxQuantity,
                idCli: client.idCli,
                idLounge: loungeType.idLounge,
                idLoungeType: loungeType.idLoungeType,
                idCardDetail: cardDetail ? cardDetail.idCardDetail : null
            }
        });

        const selectedExtras = extraServices.filter(
            (_, extraIndex) =>
                extraIndex > 0 && (extraIndex + index) % 4 === 0
        );
        const extrasTotal = selectedExtras.reduce(
            (acc, extra) => acc + Number(extra.cost),
            0
        );
        const baseValue = 1200000 + (index % 5) * 250000;
        const finalValue = round(baseValue + extrasTotal);

        const contract = await prisma.contract.create({
            data: {
                eventStartTime: new Date("1970-01-01T20:00:00.000Z"),
                eventEndTime: new Date("1970-01-01T04:00:00.000Z"),
                dateContract: reservationDate,
                finalValue,
                status: ["firmado", "aprobado", "generado", "en_revision"][index % 4],
                cantExactaInvit: cantInvit,
                idReservation: reservation.idReservation
            }
        });

        if (selectedExtras.length) {
            await prisma.reservationExtraService.createMany({
                data: selectedExtras.map((extra) => ({
                    idReservation: reservation.idReservation,
                    idService: extra.idService
                }))
            });
            await prisma.contractExtraService.createMany({
                data: selectedExtras.map((extra) => ({
                    idContract: contract.idContract,
                    idService: extra.idService
                }))
            });
        }

        const beforePayments = await prisma.payment.count({
            where: { idContract: contract.idContract }
        });

        if (scenario >= 3 && scenario <= 5 || scenario >= 10) {
            await createInstallmentPayments(
                contract,
                finalValue,
                eventDate,
                scenario,
                index
            );
        } else {
            await createLegacyPayments(
                contract,
                finalValue,
                eventDate,
                scenario,
                index
            );
        }

        const afterPayments = await prisma.payment.count({
            where: { idContract: contract.idContract }
        });
        createdPayments += afterPayments - beforePayments;

        if (admin && index < 6) {
            const mensaje = index % 2 === 0
                ? `El contrato #${contract.idContract} tiene pagos pendientes de revisión.`
                : `Se registró un nuevo pago para el contrato #${contract.idContract}.`;
            const existingNotification = await prisma.notification.findFirst({
                where: { idContract: contract.idContract, mensaje }
            });

            if (!existingNotification) {
                await prisma.notification.create({
                    data: {
                        mensaje,
                        tipo: index % 2 === 0 ? "pago_pendiente" : "pago_confirmado",
                        idContract: contract.idContract,
                        idUsuario: admin.idUsuario,
                        leida: index % 3 === 0
                    }
                });
            }
        }

        createdClients++;
        createdContracts++;
    }

    return { createdClients, createdContracts, createdPayments };
}

async function main() {
    const result = await createDemoData();

    console.log(
        `Seed de demo finalizado: ${result.createdClients} clientes, ${result.createdContracts} contratos y ${result.createdPayments} pagos creados.`
    );
    console.log(`Contraseña para clientes demo: ${DEMO_PASSWORD}`);
    console.log(`Ejemplo de acceso: demo.01${DEMO_DOMAIN}`);

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error("Error al sembrar datos demo:", error.message);
    await prisma.$disconnect();
    process.exit(1);
});
