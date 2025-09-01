import { Clock, CheckCircle, XCircle, RefreshCw, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Appointment } from "@/types";
import { format } from "date-fns";

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  showDate?: boolean;
}

const AppointmentCard = ({ appointment, onClick, showDate = false }: AppointmentCardProps) => {
  const getStatusIndicatorClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'follow up': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-3 h-3 text-green-700" />;
      case 'pending': return <Clock className="w-3 h-3 text-yellow-700" />;
      case 'cancelled': return <XCircle className="w-3 h-3 text-red-700" />;
      case 'follow up': return <RefreshCw className="w-3 h-3 text-blue-700" />;
      default: return null;
    }
  };

  // The date is stored as 'YYYY-MM-DD'. Creating a date object this way avoids timezone issues.
  const appointmentDate = new Date(`${appointment.date}T00:00:00`);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Left side: indicator, avatar, name, service */}
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

        {/* Right side: date, time, status */}
        <div className="flex sm:flex-col items-center sm:items-end gap-x-4 sm:gap-x-0 sm:gap-y-1 flex-shrink-0 pl-14 sm:pl-0">
          <div className="flex items-center text-sm font-medium text-gray-700">
            {showDate && (
              <>
                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                <span>{format(appointmentDate, "MMM d, yyyy")}</span>
                <span className="mx-1.5 text-gray-300">|</span>
              </>
            )}
            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
            <span>{appointment.time}</span>
          </div>
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