import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma.js";
import DEFAULT_CONTRACT_CONTENT from "../src/data/contractContent.js";
import { buildDemoEmail, trackDemoEmails } from "./demoEmail.js";

const DEMO_PASSWORD = "demo123";

// 20 clientes demo. Cada uno genera una cadena completa y correlacionada:
// Client -> Usuario -> Reservation -> Contract -> (ReservationExtraService /
// ContractExtraService) -> Payments -> Notification.
const DEMO_CLIENTS = [
    { name: "Lucía", surname: "Gómez", city: "Rosario", phone: "3415551001", dni: 30111001, address: "Av. Pellegrini 1200" },
    { name: "Mateo", surname: "Rodríguez", city: "Buenos Aires", phone: "1145551002", dni: 30111002, address: "Av. Santa Fe 2350" },
    { name: "Sofía", surname: "Fernández", city: "La Plata", phone: "2215551003", dni: 30111003, address: "Calle 50 1234" },
    { name: "Valentina", surname: "López", city: "Córdoba", phone: "3515551004", dni: 30111004, address: "Av. Colón 567" },
    { name: "Joaquín", surname: "Martínez", city: "Mendoza", phone: "2615551005", dni: 30111005, address: "San Martín 890" },
    { name: "Martina", surname: "Pérez", city: "Rosario", phone: "3415551006", dni: 30111006, address: "Urquiza 3455" },
    { name: "Santiago", surname: "Sosa", city: "Santa Fe", phone: "3425551007", dni: 30111007, address: "Av. Litoral 780" },
    { name: "Camila", surname: "Romero", city: "Buenos Aires", phone: "1145551008", dni: 30111008, address: "Av. Cabildo 1890" },
    { name: "Benjamín", surname: "Díaz", city: "Córdoba", phone: "3515551009", dni: 30111009, address: "Av. Rafael Núñez 4321" },
    { name: "Julieta", surname: "Álvarez", city: "La Plata", phone: "2215551010", dni: 30111010, address: "Diagonal 74 1560" },
    { name: "Agustín", surname: "Torres", city: "Mendoza", phone: "2615551011", dni: 30111011, address: "Godoy Cruz 1540" },
    { name: "Florencia", surname: "Ruiz", city: "Rosario", phone: "3415551012", dni: 30111012, address: "Av. Francia 2100" },
    { name: "Nicolás", surname: "Herrera", city: "Salta", phone: "3875551013", dni: 30111013, address: "Caseros 720" },
    { name: "Micaela", surname: "Castro", city: "San Juan", phone: "2645551014", dni: 30111014, address: "Av. Ignacio de la Roza 1100" },
    { name: "Facundo", surname: "Vargas", city: "Neuquén", phone: "2995551015", dni: 30111015, address: "Av. Argentina 420" },
    { name: "Abril", surname: "Ramírez", city: "Mar del Plata", phone: "2235551016", dni: 30111016, address: "Av. Luro 2750" },
    { name: "Tomás", surname: "Acosta", city: "Bahía Blanca", phone: "2915551017", dni: 30111017, address: "Av. Alem 1350" },
    { name: "Renata", surname: "Molina", city: "Corrientes", phone: "3795551018", dni: 30111018, address: "Junín 640" },
    { name: "Bruno", surname: "Cabrera", city: "Paraná", phone: "3435551019", dni: 30111019, address: "Av. Ramírez 980" },
    { name: "Delfina", surname: "Ortiz", city: "San Carlos de Bariloche", phone: "2945551020", dni: 30111020, address: "Mitre 350" }
];

const EVENT_TYPES = [
    "Casamiento",
    "Cumpleaños de 15",
    "Evento corporativo",
    "Aniversario",
    "Bautismo"
];

const METHODS = ["Transferencia", "Efectivo", "Mercado Pago", "Tarjeta"];

// 10 escenarios que se repiten dos veces (20 clientes). Cada uno define el
// estado del contrato/reserva y la forma de pago correlacionada.
const SCENARIOS = [
    { contract: "firmado", reservation: "confirmada", mode: "legacy", depositPaid: true, balancePaid: false, balanceReport: null },
    { contract: "firmado", reservation: "confirmada", mode: "legacy", depositPaid: true, balancePaid: true, balanceReport: null },
    { contract: "firmado", reservation: "confirmada", mode: "legacy", depositPaid: true, balancePaid: false, balanceReport: "pendiente" },
    { contract: "firmado", reservation: "confirmada", mode: "installments", installments: 3, paidInstallments: 1, reportOnNext: null },
    { contract: "firmado", reservation: "confirmada", mode: "installments", installments: 3, paidInstallments: 1, reportOnNext: "rechazado" },
    { contract: "generado", reservation: "pendiente", mode: "legacy", depositPaid: false, balancePaid: false, balanceReport: null },
    { contract: "rechazado", reservation: "pendiente", mode: "legacy", depositPaid: false, balancePaid: false, balanceReport: null },
    { contract: "en_revision", reservation: "pendiente", mode: "legacy", depositPaid: false, balancePaid: false, balanceReport: "pendiente" },
    { contract: "aprobado", reservation: "confirmada", mode: "legacy", depositPaid: true, balancePaid: false, balanceReport: null },
    { contract: "firmado", reservation: "confirmada", mode: "installments", installments: 5, paidInstallments: 2, reportOnNext: "pendiente" }
];

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

function timeAt(hour, minute = 0) {
    return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

async function getActivePrice(idLoungeType, dateEvent) {
    const prices = await prisma.price.findMany({
        where: {
            idLoungeType,
            effectiveDate: { lte: dateEvent },
            OR: [{ endDate: null }, { endDate: { gte: dateEvent } }]
        },
        orderBy: { effectiveDate: "desc" },
        take: 1
    });

    return prices[0] ? Number(prices[0].value) : 0;
}

function reportFields(kind, index) {
    if (kind === "pendiente") {
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

    if (kind === "rechazado") {
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

async function createLegacyPayments(contract, finalValue, eventDate, scenario, index) {
    const depositValue = round(finalValue * 0.3);
    const balanceValue = round(finalValue - depositValue);
    const dueDate = addDays(eventDate, -10);
    const paymentDate = addDays(new Date(), -(index + 5));

    await prisma.payment.create({
        data: {
            value: depositValue,
            statusPayment: scenario.depositPaid ? "seña" : "pendiente",
            datePayment: scenario.depositPaid ? paymentDate : dateOnly(new Date()),
            concept: "Seña",
            dueDate,
            notes: "Seña del contrato.",
            idContract: contract.idContract
        }
    });

    if (!scenario.skipBalance) {
        await prisma.payment.create({
            data: {
                value: balanceValue,
                statusPayment: scenario.balancePaid ? "pagado" : "pendiente",
                datePayment: scenario.balancePaid ? paymentDate : dateOnly(new Date()),
                concept: "Saldo",
                dueDate: scenario.balanceReport === "pendiente"
                    ? addDays(new Date(), -15)
                    : dueDate,
                notes: "Saldo restante del contrato.",
                ...reportFields(scenario.balanceReport, index),
                idContract: contract.idContract
            }
        });
    }
}

async function createInstallmentPayments(contract, finalValue, eventDate, scenario, index) {
    const depositValue = round(finalValue * 0.3);
    const remaining = round(finalValue - depositValue);
    const amounts = splitAmount(remaining, scenario.installments);
    const firstDueDate = addDays(new Date(), 10 + index);

    await prisma.payment.create({
        data: {
            value: depositValue,
            statusPayment: "seña",
            datePayment: addDays(new Date(), -(index + 8)),
            concept: "Cuota #1",
            dueDate: addDays(eventDate, -30),
            notes: "Seña. Cuota inicial del plan.",
            idContract: contract.idContract
        }
    });

    for (let i = 0; i < amounts.length; i += 1) {
        const number = i + 2;
        const isPaid = i < scenario.paidInstallments;
        let report = reportFields(null, index);

        if (!isPaid && i === scenario.paidInstallments && scenario.reportOnNext) {
            report = reportFields(scenario.reportOnNext, index);
        }

        const dueDate = addMonths(firstDueDate, i);

        await prisma.payment.create({
            data: {
                value: amounts[i],
                statusPayment: isPaid ? "pagado" : "pendiente",
                datePayment: isPaid
                    ? addDays(dueDate, -(i + 1))
                    : dateOnly(new Date()),
                concept: `Cuota #${number}`,
                dueDate,
                notes: i === 0 ? "Interés aplicado: $0.00." : null,
                ...report,
                idContract: contract.idContract
            }
        });
    }
}

async function createNotification({ admin, usuario, contract, index, scenario }) {
    const targetAdmin = index % 2 === 0 || !usuario;
    let mensaje;
    let tipo;

    if (scenario.contract === "en_revision") {
        mensaje = `El cliente envió el contrato #${contract.idContract} para revisión.`;
        tipo = "contrato_enviado";
    } else if (scenario.contract === "aprobado") {
        mensaje = `El contrato #${contract.idContract} fue aprobado. Quedó listo para firmar.`;
        tipo = "contrato_revisado";
    } else if (scenario.contract === "rechazado") {
        mensaje = `El contrato #${contract.idContract} fue rechazado. Corregí los datos y enviá de nuevo.`;
        tipo = "contrato_revisado";
    } else if (scenario.balanceReport === "pendiente" || scenario.reportOnNext === "pendiente") {
        mensaje = `El contrato #${contract.idContract} tiene un pago informado pendiente de revisión.`;
        tipo = "pago_informado";
    } else if (scenario.balanceReport === "rechazado" || scenario.reportOnNext === "rechazado") {
        mensaje = `El comprobante de pago del contrato #${contract.idContract} fue rechazado.`;
        tipo = "pago_rechazado";
    } else if (scenario.contract === "firmado") {
        mensaje = `Se registró un nuevo pago para el contrato #${contract.idContract}.`;
        tipo = "pago_confirmado";
    } else {
        mensaje = `El contrato #${contract.idContract} tiene pagos pendientes.`;
        tipo = "pago_pendiente";
    }

    await prisma.notification.create({
        data: {
            mensaje,
            tipo,
            idContract: contract.idContract,
            idUsuario: targetAdmin ? admin.idUsuario : usuario.idUsuario,
            leida: index % 3 === 0
        }
    });
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
        select: { idCardDetail: true, budget: true },
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

    if (!locations.length || !loungeTypes.length || !cardDetails.length) {
        throw new Error(
            "Faltan localidades, salones o menús. Ejecutá primero npm run seed:all."
        );
    }

    if (!admin) {
        throw new Error(
            "Falta un usuario administrador. Ejecutá primero npm run seed:usuarios."
        );
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    let createdClients = 0;
    let createdContracts = 0;
    let createdPayments = 0;
    let createdNotifications = 0;

    for (let index = 0; index < DEMO_CLIENTS.length; index += 1) {
        const item = DEMO_CLIENTS[index];
        const emailCli = buildDemoEmail({
            name: item.name,
            surname: item.surname
        });

        const existing = await prisma.client.findFirst({
            where: { emailCli },
            select: { idCli: true }
        });

        if (existing) {
            continue;
        }

        const scenario = SCENARIOS[index % SCENARIOS.length];
        const location =
            locations.find((row) => row.city === item.city) || locations[0];
        const loungeType = loungeTypes[index % loungeTypes.length];
        const cardDetail = cardDetails[index % cardDetails.length];
        const eventDate = addDays(new Date(), 25 + index * 16);
        const reservationDate = addDays(new Date(), -(12 + index * 3));
        const cantInvit = Math.min(
            loungeType.maxQuantity,
            loungeType.minQuantity +
                ((index * 7) % Math.max(1, loungeType.maxQuantity - loungeType.minQuantity + 1))
        );

        const client = await prisma.client.create({
            data: {
                nameCli: item.name,
                surnameCli: item.surname,
                phoneCli: item.phone,
                dniCli: item.dni,
                addressCli: item.address,
                emailCli,
                idLocation: location.idLocation
            }
        });

        const usuario = await prisma.usuario.create({
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
                status: scenario.reservation,
                eventType: EVENT_TYPES[index % EVENT_TYPES.length],
                cantInvit,
                maxCantInvit: loungeType.maxQuantity,
                idCli: client.idCli,
                idLounge: loungeType.idLounge,
                idLoungeType: loungeType.idLoungeType,
                idCardDetail: cardDetail.idCardDetail
            }
        });

        const extraCount = index % 4;
        const extraStart = (index * 3) % Math.max(1, extraServices.length);
        const selectedExtras = Array.from({ length: extraCount }, (_, extraIndex) =>
            extraServices[(extraStart + extraIndex) % extraServices.length]
        ).filter(Boolean);

        const extrasTotal = selectedExtras.reduce(
            (acc, extra) => acc + Number(extra.cost),
            0
        );

        if (selectedExtras.length) {
            await prisma.reservationExtraService.createMany({
                data: selectedExtras.map((extra) => ({
                    idReservation: reservation.idReservation,
                    idService: extra.idService
                }))
            });
        }

        const priceSalon = await getActivePrice(
            loungeType.idLoungeType,
            eventDate
        );
        const menuValue = Number(cardDetail.budget) * cantInvit;
        const finalValue = round(priceSalon + menuValue + extrasTotal);

        const contract = await prisma.contract.create({
            data: {
                eventStartTime: timeAt(index % 2 === 0 ? 20 : 21),
                eventEndTime: timeAt(index % 2 === 0 ? 3 : 4),
                dateContract: reservationDate,
                finalValue,
                status: scenario.contract,
                cantExactaInvit: cantInvit,
                clausulas: DEFAULT_CONTRACT_CONTENT,
                idReservation: reservation.idReservation
            }
        });

        if (selectedExtras.length) {
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

        if (scenario.mode === "installments") {
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

        await createNotification({
            admin,
            usuario,
            contract,
            index,
            scenario
        });
        createdNotifications += 1;

        createdClients++;
        createdContracts++;
    }

    await trackDemoEmails(
        DEMO_CLIENTS.map((item) =>
            buildDemoEmail({ name: item.name, surname: item.surname })
        )
    );

    return {
        createdClients,
        createdContracts,
        createdPayments,
        createdNotifications
    };
}

async function main() {
    const result = await createDemoData();

    console.log(
        `Seed de demo finalizado: ${result.createdClients} clientes, ${result.createdContracts} contratos, ${result.createdPayments} pagos y ${result.createdNotifications} notificaciones creados.`
    );
    console.log(`Contraseña para clientes demo: ${DEMO_PASSWORD}`);
    console.log(
        `Ejemplo de acceso: ${buildDemoEmail({
            name: DEMO_CLIENTS[0].name,
            surname: DEMO_CLIENTS[0].surname
        })}`
    );

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error("Error al sembrar datos demo:", error.message);
    await prisma.$disconnect();
    process.exit(1);
});
