import {
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
}

interface AppointmentCardProps {
  appointment: any;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (appointment: any) => void;
  onDelete?: (id: string) => void;
  isReadOnly?: boolean;
  customFields: CustomField[];
}

const AppointmentCard = ({ appointment, onStatusChange, onEdit, onDelete, isReadOnly = false, customFields }: AppointmentCardProps) => {
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
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && !isReadOnly) {
      onStatusChange(appointment.id, newStatus);
      toast.success(`Appointment status updated to ${newStatus}`);
    }
  };

  const handleDelete = () => {
    if (onDelete && !isReadOnly) {
      if (window.confirm(`Are you sure you want to delete the appointment for ${appointment.client_name}?`)) {
        onDelete(appointment.id);
        toast.success("Appointment deleted successfully");
      }
    }
  };

  const handleEdit = () => {
    if (onEdit && !isReadOnly) {
      onEdit(appointment);
    }
  };

  const customDataEntries = customFields
    .filter(field => appointment.custom_data && appointment.custom_data[field.name] != null && appointment.custom_data[field.name] !== '')
    .map(field => ({
      label: field.label,
      value: String(appointment.custom_data[field.name])
    }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-md w-full space-y-4">
      
      {/* Card Header: Avatar, Name, Service, and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
            {appointment.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{appointment.client_name}</h3>
            <p className="text-sm text-gray-500">{appointment.service}</p>
          </div>
        </div>
        
        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator />

      {/* Card Body: Details and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side: Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{appointment.time} ({appointment.duration} min)</span>
          </div>
          {appointment.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{appointment.phone}</span>
            </div>
          )}
          {appointment.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span>{appointment.email}</span>
            </div>
          )}
        </div>

        {/* Right side: Status */}
        <div className="flex flex-col items-start md:items-end justify-between space-y-2">
           <Badge className={`${getStatusColor(appointment.status)} border px-3 py-1.5`}>
            <div className="flex items-center space-x-1.5">
              {getStatusIcon(appointment.status)}
              <span className="capitalize font-medium text-sm">{appointment.status}</span>
            </div>
          </Badge>
          {!isReadOnly && onStatusChange && (
            <Select 
              value={appointment.status} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full md:w-40 h-9 text-sm">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Card Footer: Notes and Custom Fields */}
      {(appointment.notes || customDataEntries.length > 0) && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          {appointment.notes && (
            <div className="text-sm text-gray-700 flex items-start">
              <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
              <p className="text-gray-600 bg-gray-50 p-2 rounded-md w-full">{appointment.notes}</p>
            </div>
          )}
          {customDataEntries.length > 0 && (
            <div className="space-y-2 text-sm">
              {customDataEntries.map(entry => (
                <div key={entry.label} className="flex">
                  <span className="font-medium text-gray-500 w-28 flex-shrink-0">{entry.label}:</span>
                  <span className="text-gray-700">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;