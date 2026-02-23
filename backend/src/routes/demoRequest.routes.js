import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/role.middleware.js";
import {
  createDemoRequestController,
  listDemoRequestsController,
  approveDemoRequestController,
} from "../controllers/demoRequest.controller.js";

const router = Router();

// Public endpoint from Homepage "Book a Demo" form
router.post("/", createDemoRequestController);

// Admin review endpoints
router.get("/", authMiddleware, checkRole(["ADMIN"]), listDemoRequestsController);
router.post(
  "/:id/approve",
  authMiddleware,
  checkRole(["ADMIN"]),
  approveDemoRequestController
);

export default router;
