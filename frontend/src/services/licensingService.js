import api from "./api";

const licensingService = {
  completeMockOnboarding: async (payload) => {
    const response = await api.post("/licensing/mock-complete", payload);
    return response.data;
  },
};

export default licensingService;
