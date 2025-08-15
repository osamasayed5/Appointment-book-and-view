import { useState } from "react";
import { Plus, RefreshCw, Calendar, Settings, MoreVertical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentForm from "@/components/AppointmentForm";
import CalendarSidebar from "@/components/CalendarSidebar";
import AppointmentsList from "@/components/AppointmentsList";
import AdminPanel from "@/components/AdminPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import AdminPasscodePrompt from "@/components/AdminPasscodePrompt";
import { UserNav } from "@/components/UserNav";
import Notifications from "@/components/Notifications";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useFormConfig } from "@/hooks/useFormConfig";
import { useCustomFields } from "@/hooks/useCustomFields";
import { Appointment } from "@/types";

const Index = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { appointments, loading: appointmentsLoading, fetchAppointments, createAppointment, updateAppointment, setAppointments } = useAppointments();
  const { services, updateServices, fetchServices } = useServices();
  const { formConfig, updateFormConfig, fetchFormConfig } = useFormConfig();
  const { customFields, fetchCustomFields } = useCustomFields();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [isAdminPasscodeVerified, setIsAdminPasscodeVerified] = useState<boolean>(false);

  const isRefreshing = appointmentsLoading;

  const handleFormSave = (data: any) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, data, editingAppointment.status);
    } else {
      createAppointment(data);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleRefresh = () => {
    fetchAppointments();
    fetchServices();
    fetchFormConfig();
    fetchCustomFields();
    toast.success("Data refreshed successfully!");
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdminVerified');
    toast.info("You have been signed out.");
    setIsAdminPasscodeVerified(false);
  };

  const handleToggleAdminPanel = () => {
    if (!showAdminPanel) {
      if (localStorage.getItem('isAdminVerified') === 'true') {
        setIsAdminPasscodeVerified(true);
        toast.info("Admin access restored.");
      } else {
        setIsAdminPasscodeVerified(false);
      }
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  };

  const handlePasscodeSuccess = () => {
    setIsAdminPasscodeVerified(true);
  };

  const handlePasscodeCancel = () => {
    setShowAdminPanel(false);
    setIsAdminPasscodeVerified(false);
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  <span className="sm:hidden">
                    {showAdminPanel && isAdminPasscodeVerified ? "Admin" : "Appointments"}
                  </span>
                  <span className="hidden sm:inline">
                    {showAdminPanel && isAdminPasscodeVerified ? "Admin Panel" : "Life Step Appointment"}
                  </span>
                </h1>
              </div>
            </div>

            {/* Desktop Header Actions */}
            <div className="hidden sm:flex items-center space-x-4">
              <Notifications />
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleToggleAdminPanel}
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>
                  {showAdminPanel && isAdminPasscodeVerified ? "Back to App" : "Admin Panel"}
                </span>
              </Button>
              <UserNav onSignOut={handleSignOut} />
            </div>

            {/* Mobile Header Actions */}
            <div className="flex sm:hidden items-center space-x-2">
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleAdminPanel}>
                    <Settings className="w-4 h-4 mr-2" />
                    <span>{showAdminPanel && isAdminPasscodeVerified ? "Back to App" : "Admin Panel"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Logged in as</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        {showAdminPanel ? (
          isAdminPasscodeVerified ? (
            <AdminPanel 
              appointments={appointments}
              onUpdateAppointments={setAppointments}
              onNewAppointmentClick={handleNewAppointment}
              onEditAppointmentClick={handleEditAppointment}
              services={services.map(s => s.name)}
              onUpdateServices={updateServices}
              formConfig={formConfig}
              onUpdateFormConfig={updateFormConfig}
              customFields={customFields}
              onUpdateCustomFields={fetchCustomFields}
            />
          ) : (
            <AdminPasscodePrompt 
              onSuccess={handlePasscodeSuccess} 
              onCancel={handlePasscodeCancel} 
            />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <CalendarSidebar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                appointments={appointments}
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleNewAppointment}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </div>
              <AppointmentsList
                appointments={appointments}
                selectedDate={selectedDate}
                isReadOnly={true}
                customFields={customFields}
              />
            </div>
          </div>
        )}
      </main>

      <AppointmentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAppointment(null);
        }}
        onSave={handleFormSave}
        initialData={editingAppointment}
        title={editingAppointment ? "Edit Appointment" : "New Appointment"}
        existingAppointments={appointments}
        services={services.map(s => s.name)}
        onUpdateServices={updateServices}
        formConfig={formConfig}
        customFields={customFields}
      />
    </div>
  );
};

export default Index;