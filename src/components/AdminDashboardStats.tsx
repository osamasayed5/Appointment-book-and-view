import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle, Users, TrendingUp, RefreshCw } from "lucide-react";
import { Appointment } from "@/types";

interface AdminDashboardStatsProps {
  appointments: Appointment[];
}

const AdminDashboardStats = ({ appointments }: AdminDashboardStatsProps) => {
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getStatusCounts = (apps: Appointment[]) => {
    return {
      total: apps.length,
      approved: apps.filter(app => app.status === 'approved').length,
      pending: apps.filter(app => app.status === 'pending').length,
      cancelled: apps.filter(app => app.status === 'cancelled').length,
      followUp: apps.filter(app => app.status === 'follow up').length,
      totalHours: apps.reduce((total, app) => total + (app.duration / 60), 0)
    };
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday of the current week
    
    const weekStats = {
      total: 0,
      approved: 0,
      totalHours: 0
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAppointments = appointments.filter(app => app.date === dateStr);
      weekStats.total += dayAppointments.length;
      weekStats.approved += dayAppointments.filter(app => app.status === 'approved').length;
      weekStats.totalHours += dayAppointments.reduce((total, app) => total + (app.duration / 60), 0);
    }

    return weekStats;
  };

  const todayAppointments = appointments.filter(app => app.date === getTodayDate());
  const dailyCounts = getStatusCounts(todayAppointments);
  const weeklyStats = getWeeklyStats();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Appointments
              </span>
              <span className="font-medium text-lg text-gray-900">{dailyCounts.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Approved
              </span>
              <span className="font-medium text-green-600">{dailyCounts.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                Pending
              </span>
              <span className="font-medium text-yellow-600">{dailyCounts.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-blue-600" />
                Follow Up
              </span>
              <span className="font-medium text-blue-600">{dailyCounts.followUp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                Cancelled
              </span>
              <span className="font-medium text-red-600">{dailyCounts.cancelled}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Total Hours
                </span>
                <span className="font-medium text-blue-600">{dailyCounts.totalHours.toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Weekly Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Week Total</span>
              <span className="font-medium text-gray-900">{weeklyStats.total} appointments</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Week Approved</span>
              <span className="font-medium text-green-600">{weeklyStats.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Week Hours</span>
              <span className="font-medium text-blue-600">{weeklyStats.totalHours.toFixed(1)}h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardStats;