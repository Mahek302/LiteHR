import { User, Employee } from "../models/index.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { sendEmail } from "./emailService.js";
import { Op, fn, col, where } from "sequelize";
import {
  getPrimaryRoleFromTrialAccess,
  parseTrialAccessFromEmployee,
} from "../utils/trialAccess.js";

export const loginService = async (email, password) => {
  const normalizedInput = String(email || "").trim().toLowerCase();
  const user = await User.findOne({
    where: {
      isActive: true,
      [Op.or]: [
        where(fn("LOWER", col("User.email")), normalizedInput),
        where(fn("LOWER", col("User.username")), normalizedInput),
        where(fn("LOWER", col("employeeProfile.personalEmail")), normalizedInput),
      ],
    },
    include: [
      {
        model: Employee,
        as: "employeeProfile",
        required: false,
      },
    ],
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const { isTrial, trialAccessRoles } = parseTrialAccessFromEmployee(
    user.employeeProfile
  );
  const effectiveRole = isTrial
    ? getPrimaryRoleFromTrialAccess(trialAccessRoles)
    : user.role;

  const tokenPayload = {
    id: user.id,
    role: effectiveRole,
    employeeId: user.employeeProfile ? user.employeeProfile.id : null,
    isTrial,
    trialAccessRoles,
  };

  const token = signToken(tokenPayload);

  const username = user.username || user.email.split("@")[0];

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username,
      role: effectiveRole,
      isTrial,
      trialAccessRoles,
      employee: user.employeeProfile
        ? {
            id: user.employeeProfile.id,
            fullName: user.employeeProfile.fullName,
            employeeCode: user.employeeProfile.employeeCode,
            department: user.employeeProfile.department,
            designation: user.employeeProfile.designation,
            phone: user.employeeProfile.phone,
            location: user.employeeProfile.location,
            status: user.employeeProfile.status,
            profileImage: user.employeeProfile.profileImage,
          }
        : null,
    },
  };
};

export const forgotPasswordService = async (email) => {
  const normalizedInput = String(email || "").trim().toLowerCase();
  const user = await User.findOne({
    where: {
      [Op.or]: [
        where(fn("LOWER", col("User.email")), normalizedInput),
        where(fn("LOWER", col("User.username")), normalizedInput),
        where(fn("LOWER", col("employeeProfile.personalEmail")), normalizedInput),
      ],
    },
    include: [{ model: Employee, as: "employeeProfile", required: false }],
  });

  if (!user) {
    console.log(`[Forgot Password] Email not found: ${email}`);
    return { message: "If your email is registered, you will receive a reset link." };
  }

  const targetEmail = user.employeeProfile?.personalEmail || user.email;
  const resetToken = signToken({ id: user.id, type: "reset" }, "1h");
  const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #7C3AED;">LiteHR Password Reset</h2>
      <p>Hello ${user.username || "User"},</p>
      <p>You requested a password reset.</p>
      <p>Click the button below to proceed (link expires in 1 hour):</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: #fff; text-decoration: none; border-radius: 5px; margin: 15px 0;">Reset Password</a>
      <p>This link was sent to <strong>${targetEmail}</strong> as it is your registered personal contact.</p>
    </div>
  `;

  await sendEmail(targetEmail, "Reset Your Password - LiteHR", emailHtml);

  return { message: `Password reset link sent to your email (${targetEmail}).` };
};

export const resetPasswordService = async (token, newPassword) => {
  const normalizedToken = String(token || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "");
  const decoded = verifyToken(normalizedToken);

  if (!decoded || decoded.type !== "reset") {
    throw new Error("Invalid or expired reset token.");
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw new Error("User not found.");
  }

  const hashedPassword = await hashPassword(newPassword);
  user.passwordHash = hashedPassword;
  await user.save();

  return { message: "Password has been successfully updated." };
};

