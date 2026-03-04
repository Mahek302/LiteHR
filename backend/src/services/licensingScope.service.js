import { Op } from "sequelize";
import { Employee, Setting, User } from "../models/index.js";

export const getMockLicensingScope = async (requestingUser) => {
  if (!requestingUser?.id || requestingUser.role !== "ADMIN") {
    return null;
  }

  const user = await User.findByPk(requestingUser.id, {
    include: [{ model: Employee, as: "employeeProfile" }],
  });
  if (!user || !user.employeeProfile) {
    return null;
  }

  const looksLikeMockAdmin =
    user.employeeProfile.designation === "System Administrator" &&
    user.employeeProfile.department === "Administration";
  if (!looksLikeMockAdmin) {
    return null;
  }

  const settings = await Setting.findOne({ where: { key: "company_settings" } });
  const settingsValue = settings?.value || {};
  const mode = settingsValue?.licensing?.mode;
  const companyEmail = String(settingsValue?.general?.companyEmail || "")
    .trim()
    .toLowerCase();
  const userEmail = String(user.email || "").trim().toLowerCase();

  if (mode !== "mock_payment_flow" || !companyEmail || companyEmail !== userEmail) {
    return null;
  }

  const scopedUsers = await User.findAll({
    where: {
      isActive: true,
      role: { [Op.ne]: "ADMIN" },
      createdAt: { [Op.gte]: user.createdAt },
    },
    attributes: ["id"],
    raw: true,
  });
  const userIds = scopedUsers.map((item) => item.id);

  if (!userIds.length) {
    return { userIds: [], employeeIds: [] };
  }

  const employees = await Employee.findAll({
    where: { userId: { [Op.in]: userIds } },
    attributes: ["id"],
    raw: true,
  });
  const employeeIds = employees.map((item) => item.id);

  return { userIds, employeeIds };
};
