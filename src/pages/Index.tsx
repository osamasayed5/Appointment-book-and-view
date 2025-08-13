import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";
import CalendarSidebar from "@/components/CalendarSidebar";
import AppointmentsList from "@/components/AppointmentsList";
import AdminPanel from "@/components/AdminPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import AdminPasscodePrompt from "@/components/AdminPasscodePrompt";
import { UserNav } from "@/components/UserNav";
import { logActivity } from "@/utils/activityLogger";
import Notifications from "@/components/Notifications";
import { sendSystemNotification } from "@/utils/notificationSender";

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

interface Service {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

interface FormConfig {
  show_phone: boolean;
  require_phone: boolean;
  show_email: boolean;
  require_email: boolean;
  show_notes: boolean;
  require_notes: boolean;
  show_duration: boolean;
  require_duration: boolean;
  show_client_name: boolean;
  require_client_name: boolean;
  show_service: boolean;
  require_service: boolean;
  show_date: boolean;
  require_date: boolean;
  show_time: boolean;
  require_time: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
  is_visible: boolean;
}

const Index = () => {
  const { session, isLoading } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [isAdminPasscodeVerified, setIsAdminPasscodeVerified] = useState<boolean>(false);
  const [formConfig, setFormConfig] = useState<FormConfig>({
    show_phone: true,
    require_phone: false,
    show_email: true,
    require_email: false,
    show_notes: true,
    require_notes: false,
    show_duration: true,
    require_duration: true,
    show_client_name: true,
    require_client_name: true,
    show_service: true,
    require_service: true,
    show_date: true,
    require_date: true,
    show_time: true,
    require_time: true,
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const fetchAppointments = useCallback(async () => {
    if (!session) return;
    setIsRefreshing(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments.");
    } else {
      setAppointments(data as Appointment[]);
    }
    setIsRefreshing(false);
  }, [session]);

  const fetchServices = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services.");
    } else {
      setServices(data as Service[]);
    }
  }, [session]);

  const fetchFormConfig = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('appointment_form_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching form config:", error);
    } else if (data) {
      setFormConfig(data);
    }
  }, [session]);

  const fetchCustomFields = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from('custom_fields').select('*').order('created_at');
    if (error) {
      toast.error("Failed to load custom fields.");
    } else {
      setCustomFields(data as CustomField[]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAppointments();
      fetchServices();
      fetchFormConfig();
      fetchCustomFields();
    }
  }, [session, fetchAppointments, fetchServices, fetchFormConfig, fetchCustomFields]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment;
            toast.success(`A new appointment for ${newAppointment.client_name} has been scheduled.`);
          } else if (payload.eventType === 'UPDATE') {
            const oldAppointment = payload.old as Appointment;
            const newAppointment = payload.new as Appointment;
            if (oldAppointment.status !== newAppointment.status) {
              toast.info(`Appointment for ${newAppointment.client_name} is now ${newAppointment.status}.`);
            }
          }
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchAppointments]);

  const handleUpdateFormConfig = async (newConfig: Partial<FormConfig>) => {
    const { error } = await supabase
      .from('appointment_form_config')
      .update(newConfig)
      .eq('id', 1);

    if (error) {
      toast.error("Failed to save form settings.");
    } else {
      setFormConfig(prev => ({ ...prev, ...newConfig }));
      toast.success("Form settings saved!");
      await logActivity('Updated form settings', newConfig);
    }
  };

  const handleCreateAppointment = async (data: any) => {
    if (!session) return;
    const { error } = await supabase
      .from('appointments')
      .insert({
        user_id: session.user.id,
        client_name: data.clientName,
        service: data.service,
        date: data.date,
        time: data.time,
        status: "pending",
        duration: data.duration,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        custom_data: data.customData || null,
      });

    if (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment.");
    } else {
      await logActivity(`Created appointment for ${data.clientName}`);
      await sendSystemNotification(
        'New Appointment Scheduled',
        `An appointment for ${data.clientName} on ${data.date} has been added.`
      );
      // The local toast is handled by the real-time listener now
    }
  };

  const handleUpdateAppointment = async (data: any) => {
    if (!editingAppointment || !session) return;

    const statusChanged = editingAppointment.status !== data.status;

    const { error } = await supabase
      .from('appointments')
      .update({
        client_name: data.clientName,
        service: data.service,
        date: data.date,
        time: data.time,
        duration: data.duration,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        status: data.status,
        custom_data: data.customData || null,
      })
      .eq('id', editingAppointment.id);

    if (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment.");
    } else {
      toast.success("Appointment updated successfully!");
      await logActivity(`Updated appointment for ${data.clientName}`, { status: data.status });
      if (statusChanged) {
        let notificationTitle = '';
        let notificationMessage = '';

        switch (data.status) {
          case 'confirmed':
            notificationTitle = 'Appointment Confirmed';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} has been confirmed.`;
            break;
          case 'cancelled':
            notificationTitle = 'Appointment Cancelled';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} has been cancelled.`;
            break;
          case 'pending':
            notificationTitle = 'Appointment Pending';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} is now pending review.`;
            break;
        }

        if (notificationTitle && notificationMessage) {
          await sendSystemNotification(notificationTitle, notificationMessage);
        }
      }
      // The local toast for status change is handled by the real-time listener
    }
    setEditingAppointment(null);
  };

  const handleFormSave = (data: any) => {
    if (editingAppointment) {
      handleUpdateAppointment(data);
    } else {
      handleCreateAppointment(data);
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

  const handleUpdateAppointments = (updatedAppointments: Appointment[]) => {
    setAppointments(updatedAppointments);
  };

  const handleUpdateServices = async (newServices: string[]) => {
    if (!session) return;

    const existingServiceNames = services.map(s => s.name);
    const servicesToAdd = newServices.filter(name => !existingServiceNames.includes(name));
    const servicesToDelete = existingServiceNames.filter(name => !newServices.includes(name));

    if (servicesToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('services')
        .insert(servicesToAdd.map(name => ({ user_id: session.user.id, name })));
      if (insertError) {
        console.error("Error adding services:", insertError);
        toast.error("Failed to add new services.");
      } else {
        await logActivity('Added services', { services: servicesToAdd });
      }
    }

    if (servicesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .in('name', servicesToDelete);
      if (deleteError) {
        console.error("Error deleting services:", deleteError);
        toast.error("Failed to delete services.");
      } else {
        await logActivity('Deleted services', { services: servicesToDelete });
      }
    }
    
    fetchServices();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdminVerified');
    toast.info("You have been signed out.");
    setIsAdminPasscodeVerified(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading user session...</p>
      </div>
    );
  }

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {showAdminPanel && isAdminPasscodeVerified ? "Admin Panel" : "Life Step Appointment"}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Notifications />
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden sm:inline-flex"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleToggleAdminPanel}
              >
                <Settings className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">
                  {showAdminPanel && isAdminPasscodeVerified ? "Back to App" : "Admin Panel"}
                </span>
              </Button>
              <UserNav onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        {showAdminPanel ? (
          isAdminPasscodeVerified ? (
            <AdminPanel 
              appointments={appointments}
              onUpdateAppointments={handleUpdateAppointments}
              onNewAppointmentClick={handleNewAppointment}
              onEditAppointmentClick={handleEditAppointment}
              services={services.map(s => s.name)}
              onUpdateServices={handleUpdateServices}
              formConfig={formConfig}
              onUpdateFormConfig={handleUpdateFormConfig}
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
        onUpdateServices={handleUpdateServices}
        formConfig={formConfig}
        customFields={customFields}
      />
    </div>
  );
};

export default Index;