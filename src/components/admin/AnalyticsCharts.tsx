import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment } from "@/types";

interface AnalyticsChartsProps {
  stats: {
    total: number;
    approved: number;
    pending: number;
    cancelled: number;
    followUp: number;
  };
  appointments: Appointment[];
}

const AnalyticsCharts = ({ stats, appointments }: AnalyticsChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Appointment Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.approved}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.pending}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Follow Up</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.followUp / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.followUp}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.cancelled}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Service Popularity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(new Set(appointments.map(app => app.service))).map(service => {
              const count = appointments.filter(app => app.service === service).length;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{service}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;