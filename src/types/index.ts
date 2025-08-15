export interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  duration: number;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  custom_data?: any;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FormConfig {
  show_phone: boolean;
  require_phone: boolean;
  show_email: boolean;
  require_email: boolean;
  show_notes: boolean;
  require_notes: boolean;
  show_duration: boolean;
  require_duration: boolean;
  show_client_name: boolean;
  require_client_name: boolean;
  show_service: boolean;
  require_service: boolean;
  show_date: boolean;
  require_date: boolean;
  show_time: boolean;
  require_time: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'link';
  is_required: boolean;
  is_visible: boolean;
}