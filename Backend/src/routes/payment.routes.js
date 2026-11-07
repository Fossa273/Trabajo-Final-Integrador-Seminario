import express from "express";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { cronAuth } from "../middlewares/cronAuth.middleware.js";
import { uploadPaymentProof } from "../middlewares/upload.middleware.js";
import paymentController from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/", authenticate, requireRole(["administrador"]), paymentController.getAll);
router.get("/settings", authenticate, requireRole(["administrador"]), paymentController.getSettings);
router.put("/settings", authenticate, requireRole(["administrador"]), paymentController.updateSettings);
router.get("/reminders/run", cronAuth, paymentController.runReminders);
router.post("/reminders/run", cronAuth, paymentController.runReminders);
router.get("/pending/count", authenticate, requireRole(["administrador"]), paymentController.getPendingCount);
router.get("/reported/count", authenticate, requireRole(["administrador"]), paymentController.getReportedCount);
router.get("/email-templates", authenticate, requireRole(["administrador"]), paymentController.getEmailTemplates);
router.put("/email-templates", authenticate, requireRole(["administrador"]), paymentController.updateEmailTemplates);
router.post("/email-templates/reset", authenticate, requireRole(["administrador"]), paymentController.resetEmailTemplates);
router.get("/contract/:idContract", authenticate, requireRole(["administrador"]), paymentController.getByContract);
router.post("/", authenticate, requireRole(["administrador"]), paymentController.create);
router.post("/:id/reminder", authenticate, requireRole(["administrador"]), paymentController.sendReminder);
router.post("/:id/report", authenticate, uploadPaymentProof, paymentController.report);
router.post("/:id/report/confirm", authenticate, requireRole(["administrador"]), paymentController.confirmReport);
router.post("/:id/report/reject", authenticate, requireRole(["administrador"]), paymentController.rejectReport);
router.get("/:id", authenticate, requireRole(["administrador"]), paymentController.getById);
router.put("/:id", authenticate, requireRole(["administrador"]), paymentController.update);
router.delete("/:id", authenticate, requireRole(["administrador"]), paymentController.delete);

export default router;
