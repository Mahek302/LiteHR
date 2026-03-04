import { Router } from "express";
import { completeMockLicensingOnboardingController } from "../controllers/licensing.controller.js";

const router = Router();

// Mock flow endpoint: assumes payment already done on frontend.
router.post("/mock-complete", completeMockLicensingOnboardingController);

export default router;
