import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Appointment, CustomField } from "@/types";

interface AppointmentDetailsProps {
  appointment: Appointment;
  customFields: CustomField[];
}

const AppointmentDetails = ({ appointment, customFields }: AppointmentDetailsProps) => {
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

  const customDataEntries = customFields
    .filter(field => field.is_visible && appointment.custom_data && appointment.custom_data[field.name] != null && appointment.custom_data[field.name] !== '')
    .map(field => ({
      label: field.label,
      value: String(appointment.custom_data[field.name])
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16 text-2xl">
          <AvatarFallback>{appointment.client_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{appointment.client_name}</h2>
          <p className="text-gray-500">{appointment.service}</p>
        </div>
      </div>

      <Badge className={`${getStatusColor(appointment.status)} border px-3 py-1.5`}>
        <div className="flex items-center space-x-1.5">
          {getStatusIcon(appointment.status)}
          <span className="capitalize font-medium text-sm">{appointment.status}</span>
        </div>
      </Badge>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        <div className="flex items-start">
          <Calendar className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-800">{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Clock className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium text-gray-800">{appointment.time} ({appointment.duration} min)</p>
          </div>
        </div>
        {appointment.phone && (
          <div className="flex items-start">
            <Phone className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-800 break-all">{appointment.phone}</p>
            </div>
          </div>
        )}
        {appointment.email && (
          <div className="flex items-start">
            <Mail className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-800 break-all">{appointment.email}</p>
            </div>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div>
          <Separator />
          <div className="pt-6">
            <div className="flex items-start">
              <FileText className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-sm">Notes</p>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-md mt-1 whitespace-pre-wrap break-words">{appointment.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {customDataEntries.length > 0 && (
        <div>
          <Separator />
          <div className="pt-6 space-y-4">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
              <h3 className="text-md font-semibold text-gray-800">Additional Information</h3>
            </div>
            {customDataEntries.map(entry => (
              <div key={entry.label} className="flex items-start text-sm">
                <span className="font-medium text-gray-500 w-28 flex-shrink-0">{entry.label}:</span>
                <span className="text-gray-800 break-words">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;