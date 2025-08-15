import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentsTab from "./admin/AppointmentsTab";
import AnalyticsTab from "./admin/AnalyticsTab";
import SettingsTab from "./admin/SettingsTab";
import NotificationsTab from "./admin/NotificationsTab";
import ActivityLog from "./admin/ActivityLog";
import { Appointment, FormConfig, CustomField } from "@/types";

interface AdminPanelProps {
  appointments: Appointment[];
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onNewAppointmentClick: () => void;
  onEditAppointmentClick: (appointment: Appointment) => void;
  services: string[];
  onUpdateServices: (services: string[]) => void;
  formConfig: FormConfig;
  onUpdateFormConfig: (config: Partial<FormConfig>) => void;
  customFields: CustomField[];
  onUpdateCustomFields: () => void;
}

const AdminPanel = ({ 
  appointments, 
  onUpdateAppointments, 
  onNewAppointmentClick, 
  onEditAppointmentClick,
  services,
  onUpdateServices,
  formConfig,
  onUpdateFormConfig,
  customFields,
  onUpdateCustomFields
}: AdminPanelProps) => {
  return (
    <div className="animate-fadeIn">
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:justify-center">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <AppointmentsTab 
            appointments={appointments} 
            onUpdateAppointments={onUpdateAppointments}
            onNewAppointmentClick={onNewAppointmentClick}
            onEditAppointmentClick={onEditAppointmentClick}
            customFields={customFields}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab appointments={appointments} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab 
            services={services}
            onUpdateServices={onUpdateServices}
            formConfig={formConfig}
            onUpdateFormConfig={onUpdateFormConfig}
            customFields={customFields}
            onUpdateCustomFields={onUpdateCustomFields}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;