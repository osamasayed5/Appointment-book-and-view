import { useState } from "react";
import { Calendar, Clock, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import AppointmentCard from "./AppointmentCard";
import AppointmentDetails from "./AppointmentDetails";
import { Appointment, CustomField } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AppointmentsListProps {
  appointments: Appointment[];
  selectedDate: string;
  customFields: CustomField[];
}

const AppointmentsList = ({ 
  appointments, 
  selectedDate, 
  customFields
}: AppointmentsListProps) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = appointments.filter(app => app.date === selectedDate);

  const pendingAppointments = filteredAppointments.filter(app => app.status === 'pending').sort((a, b) => a.time.localeCompare(b.time));
  const approvedAppointments = filteredAppointments.filter(app => app.status === 'approved').sort((a, b) => a.time.localeCompare(b.time));
  const followUpAppointments = filteredAppointments.filter(app => app.status === 'follow up').sort((a, b) => a.time.localeCompare(b.time));
  const cancelledAppointments = filteredAppointments.filter(app => app.status === 'cancelled').sort((a, b) => a.time.localeCompare(b.time));

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleSheetClose = () => {
    setSelectedAppointment(null);
  };

  const [year, month, day] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(year, month - 1, day);

  const renderSection = (title: string, icon: React.ReactNode, appointmentList: Appointment[], emptyMessage: string) => (
    <div>
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-md font-semibold text-gray-800 ml-2">{title} ({appointmentList.length})</h3>
      </div>
      {appointmentList.length > 0 ? (
        <div className="space-y-2">
          {appointmentList.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => handleAppointmentClick(appointment)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 px-3 py-2">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Appointments for {selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </CardTitle>
          <CardDescription>
            {filteredAppointments.length} total appointment(s) scheduled for this day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
              <p className="text-gray-600">No appointments scheduled for this date.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {renderSection(
                  "Pending",
                  <Clock className="w-5 h-5 text-yellow-600" />,
                  pendingAppointments,
                  "No pending appointments."
                )}
                <Separator />
                {renderSection(
                  "Approved",
                  <CheckCircle className="w-5 h-5 text-green-600" />,
                  approvedAppointments,
                  "No approved appointments."
                )}
                <Separator />
                {renderSection(
                  "Needs Follow Up",
                  <RefreshCw className="w-5 h-5 text-blue-600" />,
                  followUpAppointments,
                  "No appointments marked for follow up."
                )}
                <Separator />
                {renderSection(
                  "Cancelled",
                  <XCircle className="w-5 h-5 text-red-600" />,
                  cancelledAppointments,
                  "No cancelled appointments."
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedAppointment} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle>Appointment Details</SheetTitle>
                <SheetDescription>
                  Full details for the selected appointment.
                </SheetDescription>
              </SheetHeader>
              <AppointmentDetails 
                appointment={selectedAppointment} 
                customFields={customFields} 
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AppointmentsList;