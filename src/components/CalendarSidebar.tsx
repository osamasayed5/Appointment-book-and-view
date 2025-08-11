import { useState } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  TrendingUp,
  Users,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  client_name: string; // Changed to client_name
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  duration: number;
  phone?: string;
  email?: string;
  notes?: string;
}

interface CalendarSidebarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  appointments: Appointment[]; // Use Appointment interface
}

const CalendarSidebar = ({ 
  selectedDate, 
  onDateChange, 
  appointments, 
}: CalendarSidebarProps) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isToday = (date: string) => {
    return date === getTodayDate();
  };

  const isPastDate = (date: string) => {
    return new Date(date) < new Date(getTodayDate());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Calendar
          </CardTitle>
          <CardDescription>Select a date to view appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-medium text-gray-900">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="py-2 font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const date = new Date(selectedDate);
                date.setDate(day);
                const dateStr = date.toISOString().split('T')[0];
                const hasAppointments = appointments.some(app => app.date === dateStr);
                const isCurrentDate = dateStr === selectedDate;
                const isTodayDate = isToday(dateStr);
                const isPast = isPastDate(dateStr);
                
                return (
                  <button
                    key={day}
                    onClick={() => !isPast && onDateChange(dateStr)}
                    disabled={isPast}
                    className={`p-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      isCurrentDate
                        ? 'bg-blue-600 text-white'
                        : isTodayDate
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : hasAppointments
                        ? 'bg-green-100 text-green-700'
                        : isPast
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSidebar;