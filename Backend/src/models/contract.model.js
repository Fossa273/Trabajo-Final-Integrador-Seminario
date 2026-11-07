import prisma from "../lib/prisma.js";
import settingModel from "./setting.model.js";
import DEFAULT_CONTRACT_CONTENT from "../data/contractContent.js";

const CONTRACT_INCLUDE = {
    reservation: {
        include: {
            client: {
                select: {
                    idCli: true,
                    nameCli: true,
                    surnameCli: true,
                    dniCli: true,
                    phoneCli: true,
                    emailCli: true,
                    addressCli: true,
                    location: {
                        select: {
                            city: true,
                            zipCode: true
                        }
                    }
                }
            },
            lounge: {
                select: {
                    idLounge: true,
                    name: true,
                    loungeAddress: true
                }
            },
            loungeType: {
                select: {
                    idLoungeType: true,
                    nameLoungeType: true,
                    minQuantity: true,
                    maxQuantity: true
                }
            },
            cardDetail: true
        }
    },
    extraServices: {
        include: {
            extraService: {
                select: {
                    idService: true,
                    nameService: true,
                    detailService: true,
                    cost: true
                }
            }
        }
    },
    payments: { where: { activo: true } }
};

function round(value) {
    return Math.round(Number(value) * 100) / 100;
}

async function getDepositPercentage() {
    const setting = await settingModel.getByKey(
        "payment_deposit_percentage"
    );
    const parsed = Number(setting?.value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
        ? parsed
        : 30;
}

export function timeToDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;

    const str = String(value);

    if (str.includes("T")) {
        return new Date(str);
    }

    const [hh, mm] = str.split(":");
    const hour = Number(hh || 0);
    const minute = Number(mm || 0);

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

    return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

export function dateToTime(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

class ContractModel {

    async getAll() {
        const contracts = await prisma.contract.findMany({
            where: { activo: true },
            include: CONTRACT_INCLUDE,
            orderBy: { dateContract: "desc" }
        });

        return contracts.map((c) => this.mapContract(c));
    }

    async getByClient(idCli) {
        const contracts = await prisma.contract.findMany({
            where: {
                activo: true,
                reservation: {
                    idCli: Number(idCli)
                }
            },
            include: CONTRACT_INCLUDE,
            orderBy: { dateContract: "desc" }
        });

        return contracts.map((c) => this.mapContract(c));
    }

    async getById(id) {
        const contract = await prisma.contract.findUnique({
            where: { idContract: Number(id) },
            include: CONTRACT_INCLUDE
        });

        if (!contract) return null;

        return this.mapContract(contract);
    }

    async getByReservation(idReservation) {
        return await prisma.contract.findUnique({
            where: { idReservation: Number(idReservation) }
        });
    }

    async createFromReservation(idReservation, finalValue, extraIds) {
        const total = round(finalValue);
        const depositPercentage = await getDepositPercentage();
        const depositAmount = round((total * depositPercentage) / 100);

        return await prisma.$transaction(async (tx) => {
            const contract = await tx.contract.create({
                data: {
                    dateContract: new Date(),
                    finalValue: total,
                    status: "generado",
                    idReservation: Number(idReservation),
                    clausulas: DEFAULT_CONTRACT_CONTENT,
                    ...(extraIds && extraIds.length > 0
                        ? {
                            extraServices: {
                                create: extraIds.map((idService) => ({
                                    idService: Number(idService)
                                }))
                            }
                        }
                        : {})
                }
            });

            if (total <= 0) {
                return contract;
            }

            const reservation = await tx.reservation.findUnique({
                where: { idReservation: Number(idReservation) },
                select: { dateEvent: true }
            });
            const eventDate = reservation?.dateEvent || null;
            const now = new Date();

            if (depositAmount <= 0) {
                await tx.payment.create({
                    data: {
                        value: total,
                        statusPayment: "pendiente",
                        datePayment: now,
                        concept: "Saldo",
                        dueDate: eventDate,
                        idContract: contract.idContract
                    }
                });
            } else if (depositAmount >= total) {
                await tx.payment.create({
                    data: {
                        value: total,
                        statusPayment: "pendiente",
                        datePayment: now,
                        concept: "Seña",
                        dueDate: now,
                        idContract: contract.idContract
                    }
                });
            } else {
                await tx.payment.createMany({
                    data: [
                        {
                            value: depositAmount,
                            statusPayment: "pendiente",
                            datePayment: now,
                            concept: "Seña",
                            dueDate: now,
                            idContract: contract.idContract
                        },
                        {
                            value: round(total - depositAmount),
                            statusPayment: "pendiente",
                            datePayment: now,
                            concept: "Saldo",
                            dueDate: eventDate,
                            idContract: contract.idContract
                        }
                    ]
                });
            }

            return contract;
        });
    }

    async updateData(id, data) {
        const { eventStartTime, eventEndTime, cantExactaInvit, finalValue } = data;

        try {
            return await prisma.contract.update({
                where: { idContract: Number(id) },
                data: {
                    eventStartTime: timeToDate(eventStartTime),
                    eventEndTime: timeToDate(eventEndTime),
                    cantExactaInvit:
                        cantExactaInvit === undefined ||
                        cantExactaInvit === null ||
                        cantExactaInvit === ""
                            ? null
                            : Number(cantExactaInvit),
                    finalValue: Number(finalValue)
                }
            });
        } catch {
            return null;
        }
    }

    async updateStatus(id, status) {
        try {
            return await prisma.contract.update({
                where: { idContract: Number(id) },
                data: { status }
            });
        } catch {
            return null;
        }
    }

    async updateModification(id, data) {
        const {
            modificationStatus,
            modificationData,
            modificationComment,
            modificationRequestedAt,
            modificationReviewedAt
        } = data;

        try {
            return await prisma.contract.update({
                where: { idContract: Number(id) },
                data: {
                    modificationStatus: modificationStatus ?? null,
                    modificationData: modificationData ?? null,
                    modificationComment: modificationComment ?? null,
                    modificationRequestedAt: modificationRequestedAt ?? null,
                    modificationReviewedAt: modificationReviewedAt ?? null
                }
            });
        } catch {
            return null;
        }
    }

    async updateExtraServices(idContract, idServices) {
        return await prisma.$transaction(async (tx) => {
            await tx.contractExtraService.deleteMany({
                where: { idContract: Number(idContract) }
            });

            if (idServices && idServices.length > 0) {
                await tx.contractExtraService.createMany({
                    data: idServices.map((idService) => ({
                        idContract: Number(idContract),
                        idService: Number(idService)
                    }))
                });
            }
        });
    }

    async remove(id) {
        // Baja lógica: el contrato, sus pagos y sus notificaciones dejan de ser visibles,
        // pero ninguna fila se borra físicamente (historial conservado).
        try {
            return await prisma.$transaction(async (tx) => {
                await tx.payment.updateMany({
                    where: { idContract: Number(id) },
                    data: { activo: false }
                });
                await tx.notification.updateMany({
                    where: { idContract: Number(id) },
                    data: { activo: false }
                });
                await tx.contract.update({
                    where: { idContract: Number(id) },
                    data: { activo: false }
                });
            });
        } catch {
            return null;
        }
    }

    mapContract(contract) {
        return {
            ...contract,
            extraServices: contract.extraServices.map((es) => es.extraService)
        };
    }
}

export default new ContractModel();