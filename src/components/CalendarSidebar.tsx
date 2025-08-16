import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  client_name: string;
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
  appointments: Appointment[];
}

const CalendarSidebar = ({ 
  selectedDate, 
  onDateChange, 
  appointments, 
}: CalendarSidebarProps) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);

    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const newYear = currentDate.getFullYear();
    const newMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(currentDate.getDate()).padStart(2, '0');
    
    onDateChange(`${newYear}-${newMonth}-${newDay}`);
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: string) => {
    return date === getTodayDate();
  };

  // Calendar grid generation
  const [year, monthNum] = selectedDate.split('-').map(Number);
  const month = monthNum - 1; // Month is 0-indexed for Date object

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push(i);
  }
  
  const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(sYear, sMonth - 1, sDay);

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
              <h3 className="text-lg font-medium text-gray-900 text-center px-2">
                {selectedDateObj.toLocaleDateString('en-US', { 
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
              
              {calendarGrid.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const appointmentCount = appointments.filter(app => app.date === dateStr).length;
                const isCurrentDate = dateStr === selectedDate;
                const isTodayDate = isToday(dateStr);
                
                return (
                  <button
                    key={day}
                    onClick={() => onDateChange(dateStr)}
                    className={`relative p-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center justify-center aspect-square ${
                      isCurrentDate
                        ? 'bg-blue-600 text-white'
                        : isTodayDate
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                    {appointmentCount > 0 && (
                      <span className={`absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrentDate ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}>
                        {appointmentCount}
                      </span>
                    )}
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