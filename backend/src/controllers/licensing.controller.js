import { completeMockLicensingOnboardingService } from "../services/licensing.service.js";

export const completeMockLicensingOnboardingController = async (req, res) => {
  try {
    const result = await completeMockLicensingOnboardingService(req.body || {});
    return res.status(201).json({
      message: "Admin account created successfully",
      ...result,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || "Failed to complete onboarding",
    });
  }
};
