import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";
import { Appointment } from "@/types";

interface StatusOverviewProps {
  appointments: Appointment[];
  onStatusClick: (status: "pending" | "follow up") => void;
}

const StatusOverview = ({ appointments, onStatusClick }: StatusOverviewProps) => {
  const pendingCount = appointments.filter(app => app.status === 'pending').length;
  const followUpCount = appointments.filter(app => app.status === 'follow up').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onStatusClick('pending')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            Appointments awaiting approval
          </p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onStatusClick('follow up')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Follow Up</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{followUpCount}</div>
          <p className="text-xs text-muted-foreground">
            Appointments marked for follow up
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusOverview;