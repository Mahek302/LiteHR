import { Op } from "sequelize";
import crypto from "crypto";
import { fn, col, where as sqWhere } from "sequelize";
import { DemoRequest, Employee, Notification, User } from "../models/index.js";
import { createNotification } from "./notification.service.js";
import { sendEmail } from "../utils/email.js";
import { hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  getPrimaryRoleFromTrialAccess,
  normalizeTrialAccessRoles,
  serializeTrialAccessInDesignation,
} from "../utils/trialAccess.js";

const formatDateTime = (value) => {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

const getAdminActionLink = (demoRequestId) => {
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/admin/notifications?demoRequestId=${demoRequestId}`;
};

const getNextTrialEmployeeCode = async () => {
  const list = await Employee.findAll({
    where: {
      employeeCode: {
        [Op.like]: "TRL%",
      },
    },
    attributes: ["employeeCode"],
  });

  let maxCodeNumber = 0;
  list.forEach((item) => {
    const parsed = Number.parseInt(
      String(item.employeeCode || "").replace("TRL", ""),
      10
    );
    if (!Number.isNaN(parsed) && parsed > maxCodeNumber) {
      maxCodeNumber = parsed;
    }
  });

  return `TRL${String(maxCodeNumber + 1).padStart(3, "0")}`;
};

const ensureTrialUserAndProfile = async (
  request,
  trialAccessRoles = ["EMPLOYEE"]
) => {
  const normalizedAccess = normalizeTrialAccessRoles(trialAccessRoles);
  const targetRole = getPrimaryRoleFromTrialAccess(normalizedAccess);
  const designation = serializeTrialAccessInDesignation(normalizedAccess);
  const normalizedEmail = String(request.email || "").trim().toLowerCase();
  let user = await User.findOne({
    where: sqWhere(fn("LOWER", col("email")), normalizedEmail),
  });

  if (!user) {
    const tempPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await hashPassword(tempPassword);

    user = await User.create({
      email: normalizedEmail,
      username: null,
      passwordHash,
      role: targetRole,
      isActive: true,
    });
  } else if (!user.isActive || user.role !== targetRole) {
    await user.update({
      isActive: true,
      role: targetRole,
    });
  }

  const existingProfile = await Employee.findOne({
    where: { userId: user.id },
  });

  if (!existingProfile) {
    const employeeCode = await getNextTrialEmployeeCode();
    await Employee.create({
      userId: user.id,
      employeeCode,
      fullName: request.fullName || "Trial User",
      department: "Trial",
      designation,
      dateOfJoining: new Date(),
      personalEmail: normalizedEmail,
      status: "Active",
    });
  } else {
    await existingProfile.update({
      designation,
      department: "Trial",
      status: existingProfile.status || "Active",
    });
  }

  return user;
};

const sendTrialActivationEmail = async ({
  request,
  user,
  now,
  trialEnd,
  trialAccessRoles = ["EMPLOYEE"],
}) => {
  const normalizedAccess = normalizeTrialAccessRoles(trialAccessRoles);
  const accessText = normalizedAccess.join(", ");
  const activationToken = signToken(
    {
      id: user.id,
      type: "reset",
      purpose: "trial-activation",
      demoRequestId: request.id,
      trialAccessRoles: normalizedAccess,
    },
    "24h"
  );
  const activationLink = `${getFrontendBaseUrl()}/reset-password/${activationToken}`;

  await sendEmail({
    to: request.email,
    subject: "Activate Your LiteHR 15-Day Trial",
    text: `Hi ${request.fullName}, your LiteHR trial has been approved. Activate your account using this secure link (valid 24 hours): ${activationLink}\nTrial Start: ${formatDateTime(
      now
    )}\nTrial End: ${formatDateTime(trialEnd)}\nAccess: ${accessText}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;>Your LiteHR Trial Is Approved</h2>
        <p>Hi ${request.fullName},</p>
        <p>Your demo request has been approved by our admin team.</p>
        <p><strong>Trial Start:</strong> ${formatDateTime(now)}</p>
        <p><strong>Trial End:</strong> ${formatDateTime(trialEnd)}</p>
        <p><strong>Access:</strong> ${accessText}</p>
        <p style="margin: 16px 0;">
          <a href="${activationLink}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
            Activate Trial Account
          </a>
        </p>
        <p>This activation link expires in 24 hours for security.</p>
      </div>
    `,
  });
};

const buildAdminMessage = (
  request,
  status = "PENDING",
  trialAccessRoles = null
) => {
  const trim = (value, max = 45) => {
    const text = String(value || "");
    if (text.length <= max) return text;
    return `${text.slice(0, max - 3)}...`;
  };
  const interests = (request.interests || []).join(", ") || "N/A";
  const trialAccess =
    status === "APPROVED"
      ? normalizeTrialAccessRoles(trialAccessRoles).join(", ")
      : "N/A";
  let message = [
    `ID: #${request.id}`,
    `Name: ${trim(request.fullName, 35)}`,
    `Email: ${trim(request.email, 45)}`,
    `Company: ${trim(request.companyName, 45)}`,
    `Role: ${trim(request.role, 20)}`,
    `Team: ${trim(request.employees, 20)}`,
    `Interests: ${trim(interests, 40)}`,
    `Trial Access: ${trialAccess}`,
    `Status: ${status}`,
  ].join("\n");
  if (message.length > 250) {
    message = `${message.slice(0, 247)}...`;
  }
  return message;
};

const isLicensingRequest = (interests = []) =>
  Array.isArray(interests) &&
  interests.some((item) => String(item || "").toLowerCase().includes("licens"));

const getRequestLabels = (interests = []) => {
  if (isLicensingRequest(interests)) {
    return {
      singular: "Licensing Request",
      plural: "licensing request",
    };
  }
  return {
    singular: "Demo Request",
    plural: "demo request",
  };
};

export const createDemoRequestService = async (payload) => {
  const { fullName, email, companyName, companyWebsite, role, employees, interests } =
    payload;

  if (!fullName || !email || !companyName || !role || !employees) {
    throw new Error("Missing required fields");
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    throw new Error("Please select at least one interest");
  }

  const request = await DemoRequest.create({
    fullName: fullName.trim(),
    email: email.trim(),
    companyName: companyName.trim(),
    companyWebsite: companyWebsite ? companyWebsite.trim() : null,
    role: role.trim(),
    employees: employees.trim(),
    interests,
    status: "PENDING",
  });

  const admins = await User.findAll({
    where: { role: "ADMIN", isActive: true },
    attributes: ["id", "email"],
  });

  const actionLink = getAdminActionLink(request.id);
  const detailsMessage = buildAdminMessage(request, "PENDING");
  const labels = getRequestLabels(request.interests);
  const title = `Request for ${labels.singular} #${request.id}`;

  // Send submit confirmation to requester first.
  // This should not depend on admin-notification email success.
  await sendEmail({
    to: request.email,
    subject: `We received your WORKFORCEDGE ${labels.plural}`,
    text: `Hi ${request.fullName}, we have received your ${labels.plural}. Our admin team will review it and contact you soon.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${labels.singular} Received</h2>
        <p>Hi ${request.fullName},</p>
        <p>Thanks for contacting WORKFORCEDGE. Your request is now in review.</p>
        <p><strong>Request ID:</strong> #${request.id}</p>
        <p><strong>Status:</strong> Pending Admin Approval</p>
        <p>We will email you once approved.</p>
      </div>
    `,
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        title,
        message: detailsMessage,
        type: "SYSTEM",
      })
    )
  );

  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  if (adminEmails.length > 0) {
    const interestsText = request.interests.join(", ");
    try {
      await sendEmail({
        to: adminEmails.join(","),
        subject: `New ${labels.singular} #${request.id} - WORKFORCEDGE`,
        text: `New ${labels.plural} received from ${request.fullName} (${request.email}).\nCompany: ${request.companyName}\nRole: ${request.role}\nEmployees: ${request.employees}\nInterests: ${interestsText}\nAction link: ${actionLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>New WORKFORCEDGE ${labels.singular}</h2>
            <p><strong>Request ID:</strong> #${request.id}</p>
            <p><strong>Name:</strong> ${request.fullName}</p>
            <p><strong>Email:</strong> ${request.email}</p>
            <p><strong>Company:</strong> ${request.companyName}</p>
            <p><strong>Website:</strong> ${request.companyWebsite || "N/A"}</p>
            <p><strong>Role:</strong> ${request.role}</p>
            <p><strong>Employees:</strong> ${request.employees}</p>
            <p><strong>Interests:</strong> ${interestsText}</p>
            <p style="margin-top: 20px;">
              <a href="${actionLink}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
                Review Request
              </a>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error(
        `Admin demo-notification email failed for request #${request.id}:`,
        emailErr.message
      );
    }
  }

  return request;
};

export const listDemoRequestsService = async ({ status } = {}) => {
  const where = {};
  if (status && status !== "all") {
    where.status = String(status).toUpperCase();
  }

  return DemoRequest.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
};

export const approveDemoRequestService = async ({
  demoRequestId,
  adminUserId,
  trialAccessRole = "EMPLOYEE",
  trialAccessRoles = null,
}) => {
  const normalizedAccess = normalizeTrialAccessRoles(
    Array.isArray(trialAccessRoles) ? trialAccessRoles : [trialAccessRole]
  );
  const request = await DemoRequest.findByPk(demoRequestId);
  if (!request) {
    throw new Error("Demo request not found");
  }
  const labels = getRequestLabels(request.interests);
  const requestNotificationTitles = [
    `Request for ${labels.singular} #${request.id}`,
    `${labels.singular} #${request.id}`,
    `Request for Demo #${request.id}`,
    `Demo Request #${request.id}`,
    `Request for Licensing Request #${request.id}`,
    `Licensing Request #${request.id}`,
  ];

  if (request.status === "REJECTED") {
    throw new Error("Rejected demo request cannot be approved");
  }

  if (request.status === "APPROVED") {
    const trialUser = await ensureTrialUserAndProfile(request, normalizedAccess);
    const trialStart = request.trialStartsAt || new Date();
    const trialEnd =
      request.trialEndsAt ||
      (() => {
        const end = new Date(trialStart);
        end.setDate(end.getDate() + 15);
        return end;
      })();
    await sendTrialActivationEmail({
      request,
      user: trialUser,
      now: new Date(trialStart),
      trialEnd: new Date(trialEnd),
      trialAccessRoles: normalizedAccess,
    });

    const approvedMessage = buildAdminMessage(
      request,
      "APPROVED",
      normalizedAccess
    );
    await Notification.update(
      { message: approvedMessage },
      {
        where: {
          type: "SYSTEM",
          title: { [Op.in]: requestNotificationTitles },
        },
      }
    );
    return request;
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 15);
  const trialUser = await ensureTrialUserAndProfile(request, normalizedAccess);

  await request.update({
    status: "APPROVED",
    approvedByUserId: adminUserId,
    approvedAt: now,
    trialStartsAt: now,
    trialEndsAt: trialEnd,
  });

  const approvedMessage = buildAdminMessage(
    request,
    "APPROVED",
    normalizedAccess
  );
  await Notification.update(
    { message: approvedMessage },
    {
      where: {
        type: "SYSTEM",
        title: { [Op.in]: requestNotificationTitles },
      },
    }
  );

  await sendTrialActivationEmail({
    request,
    user: trialUser,
    now,
    trialEnd,
    trialAccessRoles: normalizedAccess,
  });

  return request;
};
