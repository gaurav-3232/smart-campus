import axios from "axios";
import type {
  TokenResponse,
  Resource,
  Booking,
  BookingCreate,
  AvailabilitySlot,
  AnalyticsResponse,
  PeakHoursResponse,
  ResourceType,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 with refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/auth/refresh", {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: {
    email: string;
    full_name: string;
    password: string;
    role?: string;
    department?: string;
  }) => api.post<TokenResponse>("/auth/register", data),

  login: (email: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { email, password }),

  me: () => api.get("/auth/me"),
};

// Resources
export const resourceAPI = {
  list: (params?: {
    resource_type?: ResourceType;
    min_capacity?: number;
    search?: string;
  }) => api.get<Resource[]>("/resources", { params }),

  get: (id: number) => api.get<Resource>(`/resources/${id}`),

  create: (data: Partial<Resource>) => api.post<Resource>("/resources", data),

  update: (id: number, data: Partial<Resource>) =>
    api.patch<Resource>(`/resources/${id}`, data),

  delete: (id: number) => api.delete(`/resources/${id}`),

  availability: (id: number, date?: string) =>
    api.get<AvailabilitySlot[]>(`/resources/${id}/availability`, {
      params: date ? { date } : {},
    }),
};

// Bookings
export const bookingAPI = {
  list: (params?: { status?: string; upcoming?: boolean }) =>
    api.get<Booking[]>("/bookings", { params }),

  create: (data: BookingCreate) => api.post<Booking[]>("/bookings", data),

  update: (id: number, data: Partial<Booking>) =>
    api.patch<Booking>(`/bookings/${id}`, data),

  cancel: (id: number) => api.delete<Booking>(`/bookings/${id}`),
};

// Analytics
export const analyticsAPI = {
  utilization: (days?: number, resource_id?: number) =>
    api.get<AnalyticsResponse>("/analytics/utilization", {
      params: { days, resource_id },
    }),

  peakHours: (days?: number) =>
    api.get<PeakHoursResponse>("/analytics/peak-hours", { params: { days } }),
};

export default api;
