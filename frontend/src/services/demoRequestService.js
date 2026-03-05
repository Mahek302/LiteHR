import api from "./api";

const demoRequestService = {
  submit: async (payload) => {
    const response = await api.post("/demo-requests", payload);
    return response.data;
  },
  approve: async (id, trialAccessRoles = ["EMPLOYEE"]) => {
    const normalizedRoles = Array.isArray(trialAccessRoles)
      ? trialAccessRoles
      : [trialAccessRoles];
    const response = await api.post(`/demo-requests/${id}/approve`, {
      trialAccessRoles: normalizedRoles,
      trialAccessRole: normalizedRoles[0] || "EMPLOYEE",
    });
    return response.data;
  },
};

export default demoRequestService;
