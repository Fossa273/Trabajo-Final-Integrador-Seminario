import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

import contractController from "../controllers/contract.controller.js";

const router = Router();

router.get("/", authenticate, requireRole(["administrador"]), contractController.getAll);
router.get("/mis-contratos", authenticate, contractController.getByClient);
router.get("/:id", authenticate, contractController.getById);
router.post("/", authenticate, requireRole(["administrador"]), contractController.create);
router.put("/:id", authenticate, contractController.update);
router.put("/:id/edit", authenticate, requireRole(["administrador"]), contractController.updateAdmin);
router.delete("/:id", authenticate, requireRole(["administrador"]), contractController.delete);
router.delete("/:id/cliente", authenticate, contractController.eliminarCliente);
router.post("/:id/enviar", authenticate, contractController.enviar);
router.post("/:id/aceptar", authenticate, contractController.firmar);
router.put("/:id/revision", authenticate, requireRole(["administrador"]), contractController.review);
router.put("/:id/modificacion", authenticate, contractController.solicitarModificacion);
router.put("/:id/modificacion/revision", authenticate, requireRole(["administrador"]), contractController.revisarModificacion);
router.post("/:id/modificacion/rechazo", authenticate, contractController.contestarRechazoModificacion);
router.put("/:id/cambio-fecha", authenticate, requireRole(["administrador"]), contractController.solicitarCambioFecha);
router.post("/:id/cambio-fecha/aceptar", authenticate, contractController.aceptarCambioFecha);
router.post("/:id/cambio-fecha/cancelar", authenticate, contractController.cancelarCambioFecha);

export default router;