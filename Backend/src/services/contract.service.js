import contractModel, { timeToDate } from "../models/contract.model.js";
import reservationModel from "../models/reservation.model.js";
import priceModel from "../models/price.model.js";
import notificationService from "./notification.service.js";
import paymentService from "./payment.service.js";
import prisma from "../lib/prisma.js";

const EDITABLE_STATUSES = ["generado", "rechazado", "modificacion_en_curso"];

function toDateString(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

class ContractService {

    async getAll() {
        return await contractModel.getAll();
    }

    async getByClient(idCli) {
        return await contractModel.getByClient(idCli);
    }

    async getById(id) {
        return await contractModel.getById(id);
    }

    async generateForReservation(idReservation) {
        const existing = await contractModel.getByReservation(idReservation);

        if (existing) return existing;

        const reservation = await reservationModel.getById(idReservation);

        if (!reservation) return null;

        const calc = await this.calcValues(null, reservation);

        const extraIds = (reservation.extraServices || []).map(
            (service) => service.idService
        );

        return await contractModel.createFromReservation(
            reservation.idReservation,
            calc.total,
            extraIds
        );
    }

    async calcValues(contract, reservation) {
        const price = await priceModel.getActive(
            reservation.idLoungeType,
            reservation.dateEvent
        );
        const priceSalon = price ? Number(price.value) : 0;

        const budget = reservation.cardDetail
            ? Number(reservation.cardDetail.budget)
            : 0;

        const extras = Array.isArray(reservation.extraServices)
            ? [...reservation.extraServices]
            : Array.isArray(contract?.extraServices)
                ? [...contract.extraServices]
                : [];

        const totalExtras = extras.reduce(
            (acc, service) => acc + (Number(service.cost) || 0),
            0
        );

        const cantExacta = contract?.cantExactaInvit || null;
        const menuValue = cantExacta ? budget * cantExacta : 0;

        const total = Math.round(
            (priceSalon + menuValue + totalExtras) * 100
        ) / 100;

        return {
            priceSalon,
            menuValue,
            totalExtras,
            total,
            hasPrice: Boolean(price),
            menuBudget: budget
        };
    }

    async update(id, data, { admin = false } = {}) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (!admin && !EDITABLE_STATUSES.includes(contract.status)) {
            const error = new Error(
                "Este contrato no admite modificaciones en su estado actual."
            );
            error.statusCode = 400;
            throw error;
        }

        const reservation = contract.reservation;

        const dateEvent = data.dateEvent || reservation.dateEvent;
        const eventType = data.eventType || reservation.eventType;
        const idCardDetail = data.idCardDetail || reservation.idCardDetail;
        const idServices =
            data.idServices !== undefined
                ? data.idServices
                : (reservation && reservation.extraServices
                    ? reservation.extraServices.map((s) => s.idService)
                    : []);

        const cantExactaReal =
            data.cantExactaInvit === undefined ||
            data.cantExactaInvit === null ||
            data.cantExactaInvit === ""
                ? null
                : Number(data.cantExactaInvit);

        if (
            cantExactaReal !== null &&
            (cantExactaReal < reservation.cantInvit ||
                cantExactaReal > reservation.maxCantInvit)
        ) {
            const error = new Error(
                `La cantidad exacta de invitados debe estar entre ${reservation.cantInvit} y ${reservation.maxCantInvit} (cantidades prestablecidas en tu reserva).`
            );
            error.statusCode = 400;
            throw error;
        }

        const conflicts = await prisma.reservation.count({
            where: {
                idLounge: reservation.idLounge,
                idLoungeType: reservation.idLoungeType,
                dateEvent: new Date(dateEvent),
                status: { not: "cancelada" },
                idReservation: { not: reservation.idReservation }
            }
        });

        if (conflicts > 0) {
            const error = new Error(
                "El salón no se encuentra disponible para la nueva fecha seleccionada."
            );
            error.statusCode = 409;
            throw error;
        }

        const updatedReservation = await reservationModel.update(
            reservation.idReservation,
            {
                dateEvent,
                status: reservation.status,
                eventType,
                cantInvit: reservation.cantInvit,
                maxCantInvit: reservation.maxCantInvit,
                idCli: reservation.idCli,
                idLounge: reservation.idLounge,
                idLoungeType: reservation.idLoungeType,
                idCardDetail,
                idServices
            }
        );

        if (!updatedReservation) {
            const error = new Error("No se pudieron actualizar los datos de la reserva.");
            error.statusCode = 500;
            throw error;
        }

        await contractModel.updateExtraServices(id, idServices);

        const freshReservation = await reservationModel.getById(
            reservation.idReservation
        );
        const calc = await this.calcValues(
            { ...contract, cantExactaInvit: cantExactaReal },
            freshReservation
        );

        const updatedData = await contractModel.updateData(id, {
            eventStartTime: data.eventStartTime,
            eventEndTime: data.eventEndTime,
            cantExactaInvit: cantExactaReal,
            finalValue: calc.total
        });

        if (updatedData) {
            await paymentService.syncContractPayments(id, calc.total);
        }

        const updatedContract = await contractModel.getById(id);

        return {
            ...updatedContract,
            calc
        };
    }

    async enviar(id) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (!EDITABLE_STATUSES.includes(contract.status)) {
            const error = new Error(
                "El contrato no está en condiciones de ser enviado en su estado actual."
            );
            error.statusCode = 400;
            throw error;
        }

        const cantExactaReal = contract.cantExactaInvit;
        const reservation = contract.reservation;
        const min = reservation.cantInvit;
        const max = reservation.maxCantInvit;

        if (!cantExactaReal || cantExactaReal < min || cantExactaReal > max) {
            const error = new Error(
                `Ingresá la cantidad exacta de invitados (entre ${min} y ${max}, según las cantidades prestablecidas en tu reserva).`
            );
            error.statusCode = 400;
            throw error;
        }

        if (
            !timeToDate(contract.eventStartTime) ||
            !timeToDate(contract.eventEndTime)
        ) {
            const error = new Error(
                "Indicá la hora de inicio y fin del evento."
            );
            error.statusCode = 400;
            throw error;
        }

        await contractModel.updateStatus(id, "en_revision");

        await notificationService.notifyAdmins({
            mensaje: `El cliente envió el contrato #${id} para revisión.`,
            tipo: "contrato_enviado",
            idContract: id
        });

        return await contractModel.getById(id);
    }

    async review(id, decision) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.status !== "en_revision") {
            const error = new Error(
                "Este contrato no tiene revisiones pendientes de revisar."
            );
            error.statusCode = 400;
            throw error;
        }

        const newStatus = decision === "aprobar" ? "aprobado" : "rechazado";

        await contractModel.updateStatus(id, newStatus);

        await notificationService.notifyClient({
            idCli: contract.reservation.idCli,
            mensaje: decision === "aprobar"
                ? `El contrato #${id} fue aprobado. Quedó listo para firmar.`
                : `El contrato #${id} fue rechazado. Corregí los datos y enviá de nuevo.`,
            tipo: "contrato_revisado",
            idContract: id
        });

        return await contractModel.getById(id);
    }

    async firmar(id) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.status !== "aprobado") {
            const error = new Error(
                "El contrato solo puede aceptarse cuando la última revisión fue aprobada."
            );
            error.statusCode = 400;
            throw error;
        }

        await contractModel.updateStatus(id, "firmado");

        if (contract.modificationStatus === "aprobada") {
            await contractModel.updateModification(id, {
                modificationStatus: null,
                modificationData: null,
                modificationComment: null,
                modificationRequestedAt: null,
                modificationReviewedAt: null
            });
        }

        await notificationService.notifyAdmins({
            mensaje: `El cliente firmó el contrato #${id}.`,
            tipo: "contrato_firmado",
            idContract: id
        });

        return await contractModel.getById(id);
    }

    async solicitarModificacion(id, data) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.status !== "firmado") {
            const error = new Error(
                "Solo podés solicitar modificaciones sobre contratos firmados."
            );
            error.statusCode = 400;
            throw error;
        }

        if (contract.modificationStatus === "pendiente") {
            const error = new Error(
                "Ya existe una solicitud de modificación pendiente de aprobación."
            );
            error.statusCode = 400;
            throw error;
        }

        const reservation = contract.reservation;

        const dateEvent = toDateString(data.dateEvent || reservation.dateEvent);
        const eventType = data.eventType || reservation.eventType;
        const idCardDetail =
            data.idCardDetail === undefined || data.idCardDetail === ""
                ? reservation.idCardDetail
                : data.idCardDetail
                    ? Number(data.idCardDetail)
                    : null;
        const idServices = Array.isArray(data.idServices)
            ? data.idServices
            : contract.extraServices.map((s) => s.idService);

        const cantExactaReal =
            data.cantExactaInvit === undefined ||
            data.cantExactaInvit === null ||
            data.cantExactaInvit === ""
                ? contract.cantExactaInvit
                : Number(data.cantExactaInvit);

        const eventStartTime =
            data.eventStartTime === undefined || data.eventStartTime === ""
                ? contract.eventStartTime
                : data.eventStartTime;
        const eventEndTime =
            data.eventEndTime === undefined || data.eventEndTime === ""
                ? contract.eventEndTime
                : data.eventEndTime;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventDate = new Date(
            `${String(dateEvent).split("T")[0]}T00:00:00`
        );
        const daysUntil = Math.round(
            (eventDate.getTime() - today.getTime()) / 86400000
        );

        if (daysUntil < 14) {
            const error = new Error(
                "Las modificaciones se aceptan hasta 2 semanas (14 días) antes del evento. Ya no hay tiempo para solicitar cambios."
            );
            error.statusCode = 400;
            throw error;
        }

        if (
            cantExactaReal !== null &&
            cantExactaReal !== undefined &&
            (cantExactaReal < reservation.cantInvit ||
                cantExactaReal > reservation.maxCantInvit)
        ) {
            const error = new Error(
                `La cantidad exacta de invitados debe estar entre ${reservation.cantInvit} y ${reservation.maxCantInvit}.`
            );
            error.statusCode = 400;
            throw error;
        }

        const conflicts = await prisma.reservation.count({
            where: {
                idLounge: reservation.idLounge,
                idLoungeType: reservation.idLoungeType,
                dateEvent: new Date(dateEvent),
                status: { not: "cancelada" },
                idReservation: { not: reservation.idReservation }
            }
        });

        if (conflicts > 0) {
            const error = new Error(
                "El salón no se encuentra disponible para la nueva fecha seleccionada."
            );
            error.statusCode = 409;
            throw error;
        }

        const updated = await contractModel.updateModification(id, {
            modificationStatus: "pendiente",
            modificationData: {
                dateEvent,
                eventType,
                idCardDetail: idCardDetail ?? null,
                idServices,
                cantExactaInvit: cantExactaReal,
                eventStartTime,
                eventEndTime
            },
            modificationComment: data.comment || null,
            modificationRequestedAt: new Date()
        });

        if (!updated) {
            const error = new Error(
                "No se pudo registrar la solicitud de modificación."
            );
            error.statusCode = 500;
            throw error;
        }

        await notificationService.notifyAdmins({
            mensaje: `El cliente solicitó una modificación al contrato #${id}.`,
            tipo: "modificacion_solicitada",
            idContract: id
        });

        return await contractModel.getById(id);
    }

    async revisarModificacion(id, decision, motivo) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.modificationStatus !== "pendiente") {
            const error = new Error(
                "No hay solicitudes de modificación pendientes para este contrato."
            );
            error.statusCode = 400;
            throw error;
        }

        if (decision === "rechazar") {
            if (!(typeof motivo === "string" && motivo.trim())) {
                const error = new Error(
                    "Debés indicar el motivo del rechazo de la modificación para notificar al cliente."
                );
                error.statusCode = 400;
                throw error;
            }

            const rechazado = await contractModel.updateModification(id, {
                modificationStatus: "rechazada",
                modificationReviewedAt: new Date()
            });

            if (!rechazado) {
                const error = new Error(
                    "No se pudo registrar el rechazo de la modificación."
                );
                error.statusCode = 500;
                throw error;
            }

            await notificationService.notifyClient({
                idCli: contract.reservation.idCli,
                mensaje: `El administrador rechazó la modificación del contrato #${id} por la siguiente razón: ${motivo.trim()}. Tus datos vigentes se conservan.`,
                tipo: "modificacion_rechazada",
                idContract: id
            });

            return await contractModel.getById(id);
        }

        const data = contract.modificationData || {};
        const reservation = contract.reservation;

        const dateEvent = data.dateEvent || reservation.dateEvent;
        const eventType = data.eventType || reservation.eventType;
        const idCardDetail = data.idCardDetail || reservation.idCardDetail;
        const idServices = Array.isArray(data.idServices)
            ? data.idServices
            : contract.extraServices.map((s) => s.idService);
        const cantExactaReal =
            data.cantExactaInvit === undefined || data.cantExactaInvit === null
                ? contract.cantExactaInvit
                : Number(data.cantExactaInvit);

        const eventStartTime =
            data.eventStartTime === undefined || data.eventStartTime === ""
                ? contract.eventStartTime
                : data.eventStartTime;
        const eventEndTime =
            data.eventEndTime === undefined || data.eventEndTime === ""
                ? contract.eventEndTime
                : data.eventEndTime;

        const updatedReservation = await reservationModel.update(
            reservation.idReservation,
            {
                dateEvent,
                status: reservation.status,
                eventType,
                cantInvit: reservation.cantInvit,
                maxCantInvit: reservation.maxCantInvit,
                idCli: reservation.idCli,
                idLounge: reservation.idLounge,
                idLoungeType: reservation.idLoungeType,
                idCardDetail: idCardDetail ?? null,
                idServices
            }
        );

        if (!updatedReservation) {
            const error = new Error(
                "No se pudieron aplicar los datos de la modificación."
            );
            error.statusCode = 500;
            throw error;
        }

        await contractModel.updateExtraServices(id, idServices);

        const freshReservation = await reservationModel.getById(
            reservation.idReservation
        );
        const calc = await this.calcValues(
            { ...contract, cantExactaInvit: cantExactaReal },
            freshReservation
        );

        const updatedData = await contractModel.updateData(id, {
            eventStartTime,
            eventEndTime,
            cantExactaInvit: cantExactaReal,
            finalValue: calc.total
        });

        if (updatedData) {
            await paymentService.syncContractPayments(id, calc.total);
        }

        const aprobado = await contractModel.updateModification(id, {
            modificationStatus: "aprobada",
            modificationReviewedAt: new Date()
        });

        if (!aprobado) {
            const error = new Error(
                "No se pudo confirmar la aprobación de la modificación."
            );
            error.statusCode = 500;
            throw error;
        }

        await contractModel.updateStatus(id, "aprobado");

        await notificationService.notifyClient({
            idCli: contract.reservation.idCli,
            mensaje: `Tu modificación del contrato #${id} fue aprobada y aplicada. Quedó pendiente de tu firma.`,
            tipo: "modificacion_aprobada",
            idContract: id
        });

        const updatedContract = await contractModel.getById(id);

        return {
            ...updatedContract,
            calc
        };
    }

    async cancelar(id, motivo) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (motivo !== undefined && !(typeof motivo === "string" && motivo.trim())) {
            const error = new Error(
                "Debés indicar el motivo de la cancelación del contrato."
            );
            error.statusCode = 400;
            throw error;
        }

        if (typeof motivo === "string" && motivo.trim()) {
            await notificationService.notifyClient({
                idCli: contract.reservation.idCli,
                mensaje: `El administrador canceló el contrato #${id} por la siguiente razón: ${motivo.trim()}. Tu evento fue dado de baja.`,
                tipo: "contrato_cancelado",
                idContract: null
            });
        }

        await contractModel.remove(id);

        await reservationModel.delete(contract.idReservation);

        return true;
    }

    async eliminarCliente(id) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.status !== "firmado") {
            const error = new Error(
                "Solo podés eliminar un contrato que ya está firmado."
            );
            error.statusCode = 400;
            throw error;
        }

        const reservation = contract.reservation;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventDate = new Date(
            `${String(toDateString(reservation.dateEvent)).split("T")[0]}T00:00:00`
        );
        const daysUntil = Math.round(
            (eventDate.getTime() - today.getTime()) / 86400000
        );

        if (daysUntil < 1) {
            const error = new Error(
                "La eliminación del contrato está disponible hasta un día antes de la fecha del evento. Ya no hay tiempo para eliminarlo."
            );
            error.statusCode = 400;
            throw error;
        }

        const eliminado = await contractModel.remove(id);

        if (!eliminado) {
            const error = new Error(
                "No se pudo eliminar el contrato. Intentalo de nuevo."
            );
            error.statusCode = 500;
            throw error;
        }

        await reservationModel.delete(contract.idReservation);

        await notificationService.notifyAdmins({
            mensaje: `El cliente ${reservation.client?.nameCli || ""} ${reservation.client?.surnameCli || ""} eliminó el contrato #${id} y canceló su evento del ${toDateString(reservation.dateEvent)} (salón ${reservation.lounge?.name}${reservation.loungeType?.nameLoungeType ? ` — ${reservation.loungeType.nameLoungeType}` : ""}). No se realizan reembolsos de lo pagado.`,
            tipo: "contrato_eliminado",
            idContract: null
        });

        return true;
    }

    async contestarRechazoModificacion(id, decision) {
        const contract = await contractModel.getById(id);

        if (!contract) {
            const error = new Error("Contrato no encontrado.");
            error.statusCode = 404;
            throw error;
        }

        if (contract.modificationStatus !== "rechazada") {
            const error = new Error(
                "No hay una modificación rechazada para este contrato."
            );
            error.statusCode = 400;
            throw error;
        }

        if (decision === "continuar") {
            const limpiado = await contractModel.updateModification(id, {
                modificationStatus: null,
                modificationData: null,
                modificationComment: null,
                modificationRequestedAt: null,
                modificationReviewedAt: null
            });

            if (!limpiado) {
                const error = new Error(
                    "No se pudo actualizar el contrato."
                );
                error.statusCode = 500;
                throw error;
            }

            await notificationService.notifyAdmins({
                mensaje: `El cliente decidió continuar con el contrato #${id} sin aplicar la modificación propuesta.`,
                tipo: "modificacion_descartada",
                idContract: id
            });

            return { decision, contract: await contractModel.getById(id) };
        }

        if (decision === "cancelar") {
            await notificationService.notifyAdmins({
                mensaje: `El cliente canceló el evento del contrato #${id} tras el rechazo de la modificación.`,
                tipo: "contrato_cancelado",
                idContract: null
            });

            await this.cancelar(id);

            return { decision };
        }

        const error = new Error("La decisión debe ser 'continuar' o 'cancelar'.");
        error.statusCode = 400;
        throw error;
    }
}

export default new ContractService();