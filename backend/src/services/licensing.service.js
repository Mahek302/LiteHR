import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import { Employee, Setting, User } from "../models/index.js";
import { hashPassword } from "../utils/password.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const generateAdminEmployeeCode = async () => {
  const lastAdmin = await Employee.findOne({
    where: {
      employeeCode: {
        [Op.like]: "ADM%",
      },
    },
    order: [["createdAt", "DESC"]],
    attributes: ["employeeCode"],
  });

  let nextNum = 1;
  if (lastAdmin?.employeeCode) {
    const parsed = Number.parseInt(
      String(lastAdmin.employeeCode).replace("ADM", ""),
      10
    );
    if (!Number.isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }
  return `ADM${String(nextNum).padStart(3, "0")}`;
};

export const completeMockLicensingOnboardingService = async (payload) => {
  const {
    fullName,
    email,
    password,
    companyName,
    companyWebsite,
    employeeSize,
    billingCycle,
  } = payload;

  if (!fullName || !email || !password || !companyName || !employeeSize) {
    throw new Error("Missing required fields");
  }

  if (String(password).length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const tx = await sequelize.transaction();
  try {
    const passwordHash = await hashPassword(password);
    const employeeCode = await generateAdminEmployeeCode();

    const user = await User.create(
      {
        email: normalizedEmail,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      { transaction: tx }
    );

    const employee = await Employee.create(
      {
        userId: user.id,
        employeeCode,
        fullName: String(fullName).trim(),
        designation: "System Administrator",
        department: "Administration",
        dateOfJoining: new Date(),
        personalEmail: normalizedEmail,
        status: "Active",
      },
      { transaction: tx }
    );

    const [setting, created] = await Setting.findOrCreate({
      where: { key: "company_settings" },
      defaults: { value: {} },
      transaction: tx,
    });

    const currentValue = created ? {} : setting.value || {};
    const nextValue = {
      ...currentValue,
      general: {
        ...(currentValue.general || {}),
        companyName: String(companyName).trim(),
        companyEmail: normalizedEmail,
        website: companyWebsite ? String(companyWebsite).trim() : "",
      },
      licensing: {
        employeeSize: String(employeeSize).trim(),
        billingCycle: billingCycle === "quarterly" ? "quarterly" : "annual",
        onboardingCompletedAt: new Date().toISOString(),
        mode: "mock_payment_flow",
      },
    };

    setting.value = nextValue;
    await setting.save({ transaction: tx });

    await tx.commit();

    return {
      userId: user.id,
      employeeId: employee.id,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};
