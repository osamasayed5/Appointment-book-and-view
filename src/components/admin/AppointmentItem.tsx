import {
  Calendar,
  Clock,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  UserX,
  Edit2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface Appointment {
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

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
}

interface AppointmentItemProps {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  customFields: CustomField[];
}

const AppointmentItem = ({
  appointment,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  customFields
}: AppointmentItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled': return <UserX className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const customDataEntries = customFields
    .filter(field => appointment.custom_data && appointment.custom_data[field.name] != null && appointment.custom_data[field.name] !== '')
    .map(field => ({
      label: field.label,
      value: String(appointment.custom_data[field.name])
    }));

  return (
    <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
              {appointment.client_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{appointment.client_name}</h3>
              <p className="text-sm text-gray-600">{appointment.service}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(appointment.status)} border`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(appointment.status)}
                <span className="capitalize font-medium">{appointment.status}</span>
              </div>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(appointment)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(appointment.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {appointment.date}
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {appointment.time} ({appointment.duration} min)
          </div>
          {appointment.phone && (
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {appointment.phone}
            </div>
          )}
          {appointment.email && (
            <div className="flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {appointment.email}
            </div>
          )}
        </div>
        {appointment.notes && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-flex items-center">
            <FileText className="w-3 h-3 mr-1" />
            {appointment.notes}
          </div>
        )}
        {customDataEntries.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
              {customDataEntries.map(entry => (
                <div key={entry.label} className="flex">
                  <span className="font-medium text-gray-500 w-24 flex-shrink-0">{entry.label}:</span>
                  <span className="text-gray-700">{entry.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentItem;