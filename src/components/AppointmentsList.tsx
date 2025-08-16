import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import AppointmentCard from "./AppointmentCard";
import AppointmentDetails from "./AppointmentDetails";
import { Appointment, CustomField } from "@/types";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const appointmentsPerPage = 10;

  const filteredAppointments = appointments
    .filter(appointment => 
      appointment.date === selectedDate
    );

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleSheetClose = () => {
    setSelectedAppointment(null);
  };

  const [year, month, day] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(year, month - 1, day);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Appointments
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} appointment(s) on {selectedDateObj.toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
              <p className="text-gray-600">No appointments scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => handleAppointmentClick(appointment)}
                />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} ({filteredAppointments.length} total appointments)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
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