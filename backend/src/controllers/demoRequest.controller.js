import {
  createDemoRequestService,
  listDemoRequestsService,
  approveDemoRequestService,
} from "../services/demoRequest.service.js";

export const createDemoRequestController = async (req, res) => {
  try {
    const request = await createDemoRequestService(req.body);
    res.status(201).json({
      message: "Demo request submitted successfully",
      requestId: request.id,
      status: request.status,
    });
  } catch (err) {
    console.error("Create demo request error:", err.message);
    res.status(400).json({ message: err.message });
  }
};

export const listDemoRequestsController = async (req, res) => {
  try {
    const items = await listDemoRequestsService({ status: req.query.status });
    res.json(items);
  } catch (err) {
    console.error("List demo requests error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const approveDemoRequestController = async (req, res) => {
  try {
    const request = await approveDemoRequestService({
      demoRequestId: req.params.id,
      adminUserId: req.user.id,
      trialAccessRole: req.body?.trialAccessRole,
    });
    res.json({
      message: "Demo approved and 15-day trial activated",
      request,
    });
  } catch (err) {
    console.error("Approve demo request error:", err.message);
    res.status(400).json({ message: err.message });
  }
};
