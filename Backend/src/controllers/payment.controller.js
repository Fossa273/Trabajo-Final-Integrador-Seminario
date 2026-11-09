import paymentService from "../services/payment.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

class PaymentController {

    getAll = asyncHandler(async (req, res) => {
        const payments = await paymentService.getAll();
        return res.status(200).json(payments);
    });

    getById = asyncHandler(async (req, res) => {
        const payment = await paymentService.getById(req.params.id);
        return res.status(200).json(payment);
    });

    getByContract = asyncHandler(async (req, res) => {
        const payments = await paymentService.getByContract(
            req.params.idContract
        );
        return res.status(200).json(payments);
    });

    create = asyncHandler(async (req, res) => {
        const newPayment = await paymentService.create(req.body);
        return res.status(201).json(newPayment);
    });

    generateInstallments = asyncHandler(async (req, res) => {
        const result = await paymentService.generateInstallments(req.body);

        return res.status(201).json({
            message: "Cuotas generadas correctamente.",
            ...result
        });
    });

    update = asyncHandler(async (req, res) => {
        const paymentUpdated = await paymentService.update(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            message: "Pago actualizado correctamente.",
            payment: paymentUpdated
        });
    });

    delete = asyncHandler(async (req, res) => {
        await paymentService.delete(req.params.id);

        return res.status(200).json({
            message: "Pago dado de baja correctamente."
        });
    });

    sendReminder = asyncHandler(async (req, res) => {
        const result = await paymentService.sendReminder(req.params.id);

        return res.status(200).json({
            message: "Recordatorio de pago enviado.",
            ...result
        });
    });

    runReminders = asyncHandler(async (req, res) => {
        const result = await paymentService.runAutomaticReminders();

        return res.status(200).json({
            message: "Proceso de recordatorios finalizado.",
            ...result
        });
    });

    getPendingCount = asyncHandler(async (req, res) => {
        const count = await paymentService.getPendingCount();
        return res.status(200).json({ count });
    });

    getSettings = asyncHandler(async (req, res) => {
        const settings = await paymentService.getSettings();
        return res.status(200).json(settings);
    });

    updateSettings = asyncHandler(async (req, res) => {
        const settings = await paymentService.updateSettings(req.body);

        return res.status(200).json({
            message: "Configuración de pagos actualizada.",
            settings
        });
    });

    report = asyncHandler(async (req, res) => {
        const data = {
            ...req.body,
            reportedProofUrl: req.file
                ? `/uploads/${req.file.filename}`
                : undefined
        };
        const payment = await paymentService.reportPayment(
            req.params.id,
            data,
            req.usuario
        );

        return res.status(200).json({
            message: "Pago informado. Queda pendiente de confirmación.",
            payment
        });
    });

    confirmReport = asyncHandler(async (req, res) => {
        const payment = await paymentService.confirmReport(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            message: "Pago confirmado correctamente.",
            payment
        });
    });

    rejectReport = asyncHandler(async (req, res) => {
        const payment = await paymentService.rejectReport(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            message: "Reporte de pago rechazado.",
            payment
        });
    });

    getReportedCount = asyncHandler(async (req, res) => {
        const count = await paymentService.getReportedCount();
        return res.status(200).json({ count });
    });

    getEmailTemplates = asyncHandler(async (req, res) => {
        const templates = await paymentService.getEmailTemplates();
        return res.status(200).json(templates);
    });

    updateEmailTemplates = asyncHandler(async (req, res) => {
        const templates = await paymentService.updateEmailTemplates(req.body);

        return res.status(200).json({
            message: "Plantillas de email actualizadas.",
            templates
        });
    });

    resetEmailTemplates = asyncHandler(async (req, res) => {
        const templates = await paymentService.resetEmailTemplates();

        return res.status(200).json({
            message: "Plantillas de email restauradas.",
            templates
        });
    });
}

export default new PaymentController();
