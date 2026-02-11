import { Router } from "express";
import {
  createEmployeeController,
  listEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  deactivateEmployeeController,
  activateEmployeeController,
  uploadProfileController,
  uploadResumeController
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/role.middleware.js";
import fs from "fs";
import path from "path";
import multer from "multer";

// Ensure vault directory exists
const vaultPath = path.join(process.cwd(), "public", "uploads", "vault");
if (!fs.existsSync(vaultPath)) {
  fs.mkdirSync(vaultPath, { recursive: true });
}

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage, limits: { fileSize: 12 * 1024 * 1024 } }); // for profile images

const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, vaultPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, name + '_' + uniqueSuffix + ext);
  }
});
const uploadResume = multer({ storage: resumeStorage, limits: { fileSize: 12 * 1024 * 1024 } });

const router = Router();

// ADMIN → Create Employee
router.post(
  "/employees",
  authMiddleware,
  checkRole(["ADMIN"]),
  createEmployeeController
);

// ADMIN → List Employees
router.get(
  "/employees",
  authMiddleware,
  checkRole(["ADMIN", "MANAGER"]),
  listEmployeesController
);

// ADMIN → Get Employee by ID
router.get(
  "/employees/:id",
  authMiddleware,
  checkRole(["ADMIN", "MANAGER"]),
  getEmployeeByIdController
);

// ADMIN → Update Employee
router.put(
  "/employees/:id",
  authMiddleware,
  checkRole(["ADMIN"]),
  updateEmployeeController
);

// ADMIN → Deactivate Employee
router.post(
  "/employees/:id/deactivate",
  authMiddleware,
  checkRole(["ADMIN"]),
  deactivateEmployeeController
);

// ADMIN → Activate Employee
router.post(
  "/employees/:id/activate",
  authMiddleware,
  checkRole(["ADMIN"]),
  activateEmployeeController
);

// ADMIN / MANAGER → Upload profile image
router.post(
  "/employees/:id/upload-profile",
  authMiddleware,
  checkRole(["ADMIN", "MANAGER"]),
  upload.single("profile"),
  uploadProfileController
);

// ADMIN / MANAGER → Upload resume
router.post(
  "/employees/:id/upload-resume",
  authMiddleware,
  checkRole(["ADMIN", "MANAGER"]),
  checkRole(["ADMIN", "MANAGER"]),
  uploadResume.single("resume"),
  uploadResumeController
);

export default router;
