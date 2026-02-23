import api from "./api";

const demoRequestService = {
  submit: async (payload) => {
    const response = await api.post("/demo-requests", payload);
    return response.data;
  },
  approve: async (id, trialAccessRole = "EMPLOYEE") => {
    const response = await api.post(`/demo-requests/${id}/approve`, {
      trialAccessRole,
    });
    return response.data;
  },
};

export default demoRequestService;
