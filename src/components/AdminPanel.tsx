import { useState, useEffect, useRef } from "react";
import { Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import AdminDashboardStats from "./AdminDashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { logActivity } from "@/utils/activityLogger";

// Import modular components
import AdminHeader from "./admin/AdminHeader";
import AppointmentFilters from "./admin/AppointmentFilters";
import BulkActions from "./admin/BulkActions";
import AppointmentItem from "./admin/AppointmentItem";
import AnalyticsCharts from "./admin/AnalyticsCharts";
import SettingsForm from "./admin/SettingsForm";
import ActivityLog from "./admin/ActivityLog";

interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  duration: number;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  custom_data?: any;
}

interface FormConfig {
  show_phone: boolean;
  require_phone: boolean;
  show_email: boolean;
  require_email: boolean;
  show_notes: boolean;
  require_notes: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
  is_visible: boolean;
}

interface AdminPanelProps {
  appointments: Appointment[];
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onNewAppointmentClick: () => void;
  onEditAppointmentClick: (appointment: Appointment) => void;
  services: string[];
  onUpdateServices: (newServices: string[]) => void;
  formConfig: FormConfig;
  onUpdateFormConfig: (newConfig: Partial<FormConfig>) => void;
  customFields: CustomField[];
  onUpdateCustomFields: () => void;
}

const AdminPanel = ({ appointments, onUpdateAppointments, onNewAppointmentClick, onEditAppointmentClick, services, onUpdateServices, formConfig, onUpdateFormConfig, customFields, onUpdateCustomFields }: AdminPanelProps) => {
  const { session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appointmentsPerPage = 15;

  // Filter logic remains the same...
  const filteredAppointments = appointments
    .filter(appointment =>
      (searchTerm === "" ||
        appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.phone?.includes(searchTerm) ||
        appointment.email?.includes(searchTerm))
    )
    .filter(appointment =>
      statusFilter === "all" || appointment.status === statusFilter
    )
    .filter(appointment => {
      if (dateFilter === "all") return true;
      const today = new Date().toISOString().split('T')[0];
      const appointmentDate = new Date(appointment.date);
      const todayDate = new Date(today);

      switch (dateFilter) {
        case "today":
          return appointment.date === today;
        case "week":
          const weekFromNow = new Date(todayDate);
          weekFromNow.setDate(todayDate.getDate() + 7);
          return appointmentDate >= todayDate && appointmentDate <= weekFromNow;
        case "month":
          const monthFromNow = new Date(todayDate);
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          return appointmentDate >= todayDate && appointmentDate <= monthFromNow;
        default:
          return true;
      }
    });

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const getStatistics = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: appointments.length,
      today: appointments.filter(app => app.date === today).length,
      confirmed: appointments.filter(app => app.status === 'confirmed').length,
      pending: appointments.filter(app => app.status === 'pending').length,
      cancelled: appointments.filter(app => app.status === 'cancelled').length,
    };
  };

  const stats = getStatistics();

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAppointments(currentAppointments.map(app => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments([...selectedAppointments, id]);
    } else {
      setSelectedAppointments(selectedAppointments.filter(appId => appId !== id));
    }
    setSelectAll(selectedAppointments.length === currentAppointments.length - 1 && currentAppointments.length > 0);
  };

  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0 || !session) return;

    if (window.confirm(`Are you sure you want to delete ${selectedAppointments.length} appointment(s)?`)) {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .in('id', selectedAppointments);

      if (error) {
        console.error("Error bulk deleting appointments:", error);
        toast.error("Failed to delete appointments.");
      } else {
        onUpdateAppointments(appointments.filter(app => !selectedAppointments.includes(app.id)));
        setSelectedAppointments([]);
        setSelectAll(false);
        toast.success(`${selectedAppointments.length} appointment(s) deleted successfully`);
        await logActivity(`Bulk deleted ${selectedAppointments.length} appointments`);
      }
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedAppointments.length === 0 || !session) return;

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: status as Appointment['status'] })
      .in('id', selectedAppointments)
      .select();

    if (error) {
      console.error("Error bulk updating appointment status:", error);
      toast.error("Failed to update appointment status.");
    } else if (data) {
      const updatedAppointmentsMap = new Map(data.map(app => [app.id, app]));
      onUpdateAppointments(appointments.map(app =>
        updatedAppointmentsMap.has(app.id) ? updatedAppointmentsMap.get(app.id) as Appointment : app
      ));
      setSelectedAppointments([]);
      setSelectAll(false);
      toast.success(`${selectedAppointments.length} appointment(s) updated to ${status}`);
      await logActivity(`Bulk changed status to ${status} for ${selectedAppointments.length} appointments`);
    }
  };

  const exportToCSV = () => {
    if (filteredAppointments.length === 0) {
      toast.info("No appointments to export.");
      return;
    }
    setIsExporting(true);
    toast.loading("Exporting to CSV...", { id: 'export-toast' });

    const headers = ['Client Name', 'Service', 'Date', 'Time', 'Duration', 'Status', 'Phone', 'Email', 'Notes'];
    const customFieldHeaders = customFields.map(f => f.label);
    const allHeaders = [...headers, ...customFieldHeaders];

    const dataToExport = filteredAppointments.map(app => {
      const standardData = [
        app.client_name,
        app.service,
        app.date,
        app.time,
        app.duration,
        app.status,
        app.phone || '',
        app.email || '',
        app.notes || ''
      ];
      const customData = customFields.map(field => app.custom_data?.[field.name] || '');
      return [...standardData, ...customData];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([allHeaders, ...dataToExport]);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    toast.success("Successfully exported to CSV.", { id: 'export-toast' });
  };

  const exportToXLSX = () => {
    if (filteredAppointments.length === 0) {
      toast.info("No appointments to export.");
      return;
    }
    setIsExporting(true);
    toast.loading("Exporting to Excel...", { id: 'export-toast' });

    const dataToExport = filteredAppointments.map(app => {
      const standardData = {
        'Client Name': app.client_name,
        'Service': app.service,
        'Date': app.date,
        'Time': app.time,
        'Duration': app.duration,
        'Status': app.status,
        'Phone': app.phone || '',
        'Email': app.email || '',
        'Notes': app.notes || ''
      };
      const customData = customFields.reduce((acc, field) => {
        acc[field.label] = app.custom_data?.[field.name] || '';
        return acc;
      }, {} as Record<string, any>);
      return {...standardData, ...customData};
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

    const allHeaders = Object.keys(dataToExport[0] || {});
    const colWidths = allHeaders.map(header => ({ wch: Math.max(header.length, 15) }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `appointments_${new Date().toISOString().split('T')[0]}.xlsx`);

    setIsExporting(false);
    toast.success("Successfully exported to Excel.", { id: 'export-toast' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>) => {
    // ... import logic
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!session) return;
    const appointmentToDelete = appointments.find(app => app.id === id);
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment.");
    } else {
      onUpdateAppointments(appointments.filter(app => app.id !== id));
      toast.success('Appointment deleted successfully');
      await logActivity(`Deleted appointment for ${appointmentToDelete?.client_name}`);
    }
  };

  const handleClearAll = async () => {
    // ... clear all logic
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        onImport={handleImport}
        onExportCSV={exportToCSV}
        onExportXLSX={exportToXLSX}
        onClearAll={handleClearAll}
        isExporting={isExporting}
        filteredAppointmentsLength={filteredAppointments.length}
        onNewAppointmentClick={onNewAppointmentClick}
        fileInputRef={fileInputRef}
        isImporting={isImporting}
      />

      <AdminDashboardStats appointments={appointments} />

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />

          {filteredAppointments.length > 0 && (
            <BulkActions
              selectedAppointments={selectedAppointments}
              selectAll={selectAll}
              onSelectAll={handleSelectAll}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
              <CardDescription>
                Manage all appointments with full control
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentAppointments.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      isSelected={selectedAppointments.includes(appointment.id)}
                      onSelect={(checked) => handleSelectAppointment(appointment.id, checked as boolean)}
                      onEdit={onEditAppointmentClick}
                      onDelete={handleDeleteAppointment}
                      customFields={customFields}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} results
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsCharts stats={stats} appointments={appointments} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure your appointment system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm 
                services={services} 
                onUpdateServices={onUpdateServices}
                formConfig={formConfig}
                onUpdateFormConfig={onUpdateFormConfig}
                customFields={customFields}
                onUpdateCustomFields={onUpdateCustomFields}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <ActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;