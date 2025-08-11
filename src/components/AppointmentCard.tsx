import { CheckCircle, Clock, XCircle, Phone, Mail, FileText, Edit2, Trash2, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
}

interface AppointmentCardProps {
  appointment: any; // Keep as any for flexibility with Supabase data
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
      if (window.confirm(`Are you sure you want to delete the appointment for ${appointment.client_name}?`)) { // Use client_name
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
    <div className="border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-xl flex-shrink-0">
            {appointment.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-xl leading-tight">{appointment.client_name}</h3>
            <p className="text-sm text-gray-600 font-medium mt-1">{appointment.service}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500">
              <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1.5" />
                {appointment.time} ({appointment.duration} min)
              </div>
              {appointment.phone && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1.5" />
                  {appointment.phone}
                </div>
              )}
              {appointment.email && (
                <div className="flex items-center">
                  <Mail className="w-3 h-3 mr-1.5" />
                  {appointment.email}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0">
          <Badge className={`${getStatusColor(appointment.status)} border px-3 py-1.5 flex justify-center`}>
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
              <SelectTrigger className="w-full sm:w-32 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {!isReadOnly && onEdit && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleEdit}
              className="w-full sm:w-9 h-9"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          
          {!isReadOnly && onDelete && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 w-full sm:w-9 h-9"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      {(appointment.notes || customDataEntries.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {appointment.notes && (
            <div className="text-sm text-gray-700 flex items-start">
              <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
              <p className="text-gray-600">{appointment.notes}</p>
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