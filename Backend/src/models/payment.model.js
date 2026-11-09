import prisma from "../lib/prisma.js";

const PAYMENT_INCLUDE = {
    contract: {
        include: {
            reservation: {
                include: {
                    client: {
                        select: {
                            idCli: true,
                            nameCli: true,
                            surnameCli: true,
                            emailCli: true,
                            phoneCli: true
                        }
                    },
                    lounge: {
                        select: {
                            idLounge: true,
                            name: true
                        }
                    },
                    loungeType: {
                        select: {
                            idLoungeType: true,
                            nameLoungeType: true
                        }
                    }
                }
            }
        }
    }
};

function toDate(value) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function buildPaymentData(payment, idContract) {
    return {
        value: Number(payment.value),
        statusPayment: payment.statusPayment,
        datePayment: toDate(payment.datePayment) || new Date(),
        concept: payment.concept || "Cuota",
        dueDate: toDate(payment.dueDate),
        notes: payment.notes || null,
        idContract: Number(idContract)
    };
}

class PaymentModel {

    async getAll() {
        return await prisma.payment.findMany({
            where: { activo: true },
            include: PAYMENT_INCLUDE,
            orderBy: [{ dueDate: "asc" }, { idPayment: "asc" }]
        });
    }

    async getById(id) {
        return await prisma.payment.findUnique({
            where: { idPayment: Number(id) },
            include: PAYMENT_INCLUDE
        });
    }

    async getByContract(idContract) {
        return await prisma.payment.findMany({
            where: {
                idContract: Number(idContract),
                activo: true
            },
            include: PAYMENT_INCLUDE,
            orderBy: { idPayment: "asc" }
        });
    }

    async create(payment) {
        const {
            value,
            statusPayment,
            datePayment,
            concept,
            dueDate,
            notes,
            idContract
        } = payment;

        return await prisma.payment.create({
            data: {
                value: Number(value),
                statusPayment,
                datePayment: toDate(datePayment) || new Date(),
                concept: concept || "Cuota",
                dueDate: toDate(dueDate),
                notes: notes || null,
                idContract: Number(idContract)
            },
            include: PAYMENT_INCLUDE
        });
    }

    async applyInstallments({
        idContract,
        depositUpdate,
        depositCreate,
        deleteIds = [],
        newPayments = []
    }) {
        return await prisma.$transaction(async (tx) => {
            if (depositUpdate) {
                await tx.payment.update({
                    where: { idPayment: Number(depositUpdate.idPayment) },
                    data: depositUpdate.data
                });
            }

            if (depositCreate) {
                await tx.payment.create({
                    data: buildPaymentData(depositCreate, idContract)
                });
            }

            if (deleteIds.length > 0) {
                await tx.payment.updateMany({
                    where: {
                        idPayment: {
                            in: deleteIds.map((id) => Number(id))
                        }
                    },
                    data: { activo: false }
                });
            }

            const created = [];

            for (const payment of newPayments) {
                const row = await tx.payment.create({
                    data: buildPaymentData(payment, idContract)
                });
                created.push(row);
            }

            return created;
        });
    }

    async update(id, payment) {
        const data = {};

        if (payment.value !== undefined) data.value = Number(payment.value);
        if (payment.statusPayment !== undefined) data.statusPayment = payment.statusPayment;
        if (payment.datePayment !== undefined) data.datePayment = toDate(payment.datePayment);
        if (payment.concept !== undefined) data.concept = payment.concept || null;
        if (payment.dueDate !== undefined) data.dueDate = toDate(payment.dueDate);
        if (payment.notes !== undefined) data.notes = payment.notes || null;
        if (payment.idContract !== undefined) data.idContract = Number(payment.idContract);
        if (payment.reportStatus !== undefined) data.reportStatus = payment.reportStatus || null;
        if (payment.reportReviewedAt !== undefined) {
            data.reportReviewedAt = payment.reportReviewedAt
                ? toDate(payment.reportReviewedAt)
                : null;
        }
        if (payment.reportReviewNotes !== undefined) {
            data.reportReviewNotes = payment.reportReviewNotes || null;
        }

        try {
            return await prisma.payment.update({
                where: { idPayment: Number(id) },
                data,
                include: PAYMENT_INCLUDE
            });
        } catch {
            return null;
        }
    }

    async reportPayment(id, report) {
        return await prisma.payment.update({
            where: { idPayment: Number(id) },
            data: {
                reportedAt: new Date(),
                reportedPaymentDate: toDate(report.reportedPaymentDate) || new Date(),
                reportedMethod: report.reportedMethod || null,
                reportedReference: report.reportedReference || null,
                reportedNotes: report.reportedNotes || null,
                reportedProofUrl: report.reportedProofUrl || null,
                reportStatus: "pendiente",
                reportReviewedAt: null,
                reportReviewNotes: null
            },
            include: PAYMENT_INCLUDE
        });
    }

    async confirmReport(id, { statusPayment, datePayment, reportReviewNotes }) {
        return await prisma.payment.update({
            where: { idPayment: Number(id) },
            data: {
                statusPayment,
                datePayment: toDate(datePayment) || new Date(),
                reportStatus: "confirmado",
                reportReviewedAt: new Date(),
                reportReviewNotes: reportReviewNotes || null
            },
            include: PAYMENT_INCLUDE
        });
    }

    async rejectReport(id, reason) {
        return await prisma.payment.update({
            where: { idPayment: Number(id) },
            data: {
                reportStatus: "rechazado",
                reportReviewedAt: new Date(),
                reportReviewNotes: reason
            },
            include: PAYMENT_INCLUDE
        });
    }

    async markReminderSent(id) {
        return await prisma.payment.update({
            where: { idPayment: Number(id) },
            data: { lastReminderAt: new Date() }
        });
    }

    async getPendingForReminder(startDate, endDate) {
        return await prisma.payment.findMany({
            where: {
                activo: true,
                statusPayment: "pendiente",
                OR: [
                    { reportStatus: null },
                    { reportStatus: { not: "pendiente" } }
                ],
                contract: {
                    is: {
                        activo: true,
                        reservation: {
                            is: {
                                dateEvent: {
                                    gte: startDate,
                                    lt: endDate
                                }
                            }
                        }
                    }
                }
            },
            include: PAYMENT_INCLUDE,
            orderBy: { dueDate: "asc" }
        });
    }

    async countPending() {
        return await prisma.payment.count({
            where: {
                activo: true,
                statusPayment: "pendiente",
                contract: {
                    is: { activo: true }
                }
            }
        });
    }

    async countReported() {
        return await prisma.payment.count({
            where: {
                activo: true,
                statusPayment: "pendiente",
                reportStatus: "pendiente",
                contract: {
                    is: { activo: true }
                }
            }
        });
    }

    async delete(id) {
        try {
            await prisma.payment.update({
                where: { idPayment: Number(id) },
                data: { activo: false }
            });
            return true;
        } catch {
            return null;
        }
    }
}

export default new PaymentModel();
