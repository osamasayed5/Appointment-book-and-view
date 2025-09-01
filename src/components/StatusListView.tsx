import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ListChecks } from "lucide-react";
import AppointmentCard from "./AppointmentCard";
import { Appointment } from "@/types";

interface StatusListViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const StatusListView = ({ appointments, onAppointmentClick }: StatusListViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filterAndSortAppointments = (status?: Appointment['status']) => {
    return appointments
      .filter(app => !status || app.status === status)
      .filter(app => 
        searchTerm === "" ||
        app.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.time.localeCompare(b.time));
  };

  const renderAppointmentList = (apps: Appointment[], emptyMessage: string) => (
    <ScrollArea className="h-[60vh] pr-4">
      {apps.length > 0 ? (
        <div className="space-y-2">
          {apps.map(app => (
            <AppointmentCard key={app.id} appointment={app} onClick={() => onAppointmentClick(app)} showDate={true} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-12">{emptyMessage}</p>
      )}
    </ScrollArea>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListChecks className="w-5 h-5 mr-2" />
          All Appointments by Status
        </CardTitle>
        <CardDescription>View and manage all appointments, organized by their current status.</CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search all appointments..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="follow up">Follow Up</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {renderAppointmentList(filterAndSortAppointments(), "No appointments found.")}
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            {renderAppointmentList(filterAndSortAppointments("pending"), "No pending appointments found.")}
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            {renderAppointmentList(filterAndSortAppointments("approved"), "No approved appointments found.")}
          </TabsContent>
          <TabsContent value="follow up" className="mt-4">
            {renderAppointmentList(filterAndSortAppointments("follow up"), "No appointments need follow up.")}
          </TabsContent>
          <TabsContent value="cancelled" className="mt-4">
            {renderAppointmentList(filterAndSortAppointments("cancelled"), "No cancelled appointments found.")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StatusListView;