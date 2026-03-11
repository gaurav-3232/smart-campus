export type UserRole = 'admin' | 'staff' | 'student';
export type ResourceType = 'room' | 'lab' | 'equipment';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Resource {
  id: number;
  name: string;
  resource_type: ResourceType;
  description: string | null;
  location: string | null;
  capacity: number | null;
  amenities: string[];
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Booking {
  id: number;
  resource_id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  recurring_group_id: string | null;
  created_at: string;
  resource?: Resource;
  user?: User;
}

export interface BookingCreate {
  resource_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
  recurrence_weeks?: number;
}

export interface UtilizationStat {
  resource_id: number;
  resource_name: string;
  total_bookings: number;
  total_hours: number;
  utilization_pct: number;
}

export interface PeakHourStat {
  hour: number;
  booking_count: number;
}

export interface AnalyticsResponse {
  utilization: UtilizationStat[];
  total_resources: number;
  total_bookings: number;
  avg_utilization: number;
}

export interface PeakHoursResponse {
  peak_hours: PeakHourStat[];
  busiest_hour: number;
  busiest_count: number;
}
