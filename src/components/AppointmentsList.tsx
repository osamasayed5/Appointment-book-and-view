import { useState } from "react";
import { Calendar, Search, Filter, Clock, User, Download, Trash2, CheckCircle, BarChart3, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AppointmentCard from "./AppointmentCard";
import * as XLSX from 'xlsx';

interface Appointment {
  id: string;
  user_id: string;
  client_name: string; // Changed to client_name
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  duration: number;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  selectedDate: string;
  onStatusChange?: (id: string, status: string) => void; // Make optional
  onEdit?: (appointment: any) => void; // Make optional
  onDelete?: (id: string) => void; // Make optional
  isReadOnly?: boolean; // New prop
}

const AppointmentsList = ({ 
  appointments, 
  selectedDate, 
  onStatusChange, 
  onEdit, 
  onDelete,
  isReadOnly = false
}: AppointmentsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5; // Display 5 appointments per page

  const filteredAppointments = appointments
    .filter(appointment => 
      appointment.date === selectedDate
    );

  // Calculate appointments for the current page
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Appointments
            </CardTitle>
            <CardDescription>
              {filteredAppointments.length} appointment(s) on {new Date(selectedDate).toLocaleDateString()}
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
          <div className="space-y-4">
            {currentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-start space-x-3">
                <AppointmentCard
                  appointment={appointment}
                  isReadOnly={isReadOnly}
                  {...(!isReadOnly && { onStatusChange, onEdit, onDelete })}
                />
              </div>
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
  );
};

export default AppointmentsList;