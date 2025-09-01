import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Appointment } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface StatusAppointmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status: "pending" | "follow up" | null;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const StatusAppointmentsDialog = ({
  isOpen,
  onClose,
  status,
  appointments,
  onAppointmentClick,
}: StatusAppointmentsDialogProps) => {
  if (!status) return null;

  const title = status === 'pending' ? "Pending Appointments" : "Appointments Needing Follow Up";
  const description = `A list of all appointments currently marked as "${status}".`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 py-4">
            {appointments.length > 0 ? (
              appointments.map(app => (
                <button
                  key={app.id}
                  onClick={() => onAppointmentClick(app)}
                  className="w-full text-left p-3 rounded-md flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{app.client_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{app.client_name}</p>
                      <p className="text-sm text-muted-foreground">{app.service}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(app.date), "MMM d, yyyy")}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No appointments found with this status.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StatusAppointmentsDialog;