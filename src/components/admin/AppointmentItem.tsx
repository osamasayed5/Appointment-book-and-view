import {
  Calendar,
  Clock,
  CheckCircle,
  UserX,
  Edit2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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

interface AppointmentItemProps {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onViewDetails: (appointment: Appointment) => void;
}

const AppointmentItem = ({
  appointment,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
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

  return (
    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 items-center cursor-pointer"
        onClick={() => onViewDetails(appointment)}
      >
        {/* Client Info */}
        <div className="flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
            {appointment.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate">{appointment.client_name}</h3>
            <p className="text-sm text-gray-600 truncate">{appointment.service}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="text-sm text-gray-500 hidden sm:flex flex-col items-start">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1.5" />
            {appointment.date}
          </div>
          <div className="flex items-center mt-1">
            <Clock className="w-3 h-3 mr-1.5" />
            {appointment.time}
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-start sm:justify-end">
          <Badge className={`${getStatusColor(appointment.status)} border`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(appointment.status)}
              <span className="capitalize font-medium">{appointment.status}</span>
            </div>
          </Badge>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AppointmentItem;