import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Appointment } from "@/types";

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

const AppointmentCard = ({ appointment, onClick }: AppointmentCardProps) => {
  const getStatusIndicatorClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-3 h-3 text-green-700" />;
      case 'pending': return <Clock className="w-3 h-3 text-yellow-700" />;
      case 'cancelled': return <XCircle className="w-3 h-3 text-red-700" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-2 h-10 rounded-full ${getStatusIndicatorClass(appointment.status)} flex-shrink-0`}></div>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{appointment.client_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{appointment.client_name}</p>
            <p className="text-sm text-gray-500 truncate">{appointment.service}</p>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-4">
          <p className="font-medium text-gray-700">{appointment.time}</p>
          <div className="flex items-center space-x-1 text-xs text-gray-500 capitalize">
            {getStatusIcon(appointment.status)}
            <span>{appointment.status}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default AppointmentCard;