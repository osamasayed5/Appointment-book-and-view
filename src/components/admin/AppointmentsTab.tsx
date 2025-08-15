import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import AdminHeader from './AdminHeader';
import AppointmentFilters from './AppointmentFilters';
import BulkActions from './BulkActions';
import AppointmentItem from './AppointmentItem';
import { Appointment, CustomField } from '@/types';
import { logActivity } from '@/utils/activityLogger';
import { sendSystemNotification } from '@/utils/notificationSender';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface AppointmentsTabProps {
  appointments: Appointment[];
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onNewAppointmentClick: () => void;
  onEditAppointmentClick: (appointment: Appointment) => void;
  customFields: CustomField[];
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  onUpdateAppointments,
  onNewAppointmentClick,
  onEditAppointmentClick,
  customFields,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAppointments = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    return appointments.filter(app => {
      const searchMatch = searchTerm.toLowerCase() === '' ||
        app.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.email && app.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.phone && app.phone.includes(searchTerm));

      const statusMatch = statusFilter === 'all' || app.status === statusFilter;

      const dateMatch = dateFilter === 'all' ||
        (dateFilter === 'today' && app.date === todayStr) ||
        (dateFilter === 'week' && isWithinInterval(new Date(app.date), { start: weekStart, end: weekEnd })) ||
        (dateFilter === 'month' && isWithinInterval(new Date(app.date), { start: monthStart, end: monthEnd }));

      return searchMatch && statusMatch && dateMatch;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAppointments(filteredAppointments.map(app => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments(prev => [...prev, id]);
    } else {
      setSelectedAppointments(prev => prev.filter(appId => appId !== id));
      setSelectAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        toast.error('Failed to delete appointment.');
      } else {
        toast.success('Appointment deleted.');
        await logActivity('Deleted appointment', { id });
        onUpdateAppointments(appointments.filter(app => app.id !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedAppointments.length} appointments?`)) {
      const { error } = await supabase.from('appointments').delete().in('id', selectedAppointments);
      if (error) {
        toast.error('Failed to delete appointments.');
      } else {
        toast.success(`${selectedAppointments.length} appointments deleted.`);
        await logActivity('Bulk deleted appointments', { count: selectedAppointments.length });
        onUpdateAppointments(appointments.filter(app => !selectedAppointments.includes(app.id)));
        setSelectedAppointments([]);
        setSelectAll(false);
      }
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedAppointments.length === 0) return;
    const { error } = await supabase.from('appointments').update({ status }).in('id', selectedAppointments);
    if (error) {
      toast.error('Failed to update statuses.');
    } else {
      toast.success(`${selectedAppointments.length} appointments updated to ${status}.`);
      await logActivity('Bulk updated appointment status', { count: selectedAppointments.length, status });
      
      const updatedAppointments = appointments.map(app => 
        selectedAppointments.includes(app.id) ? { ...app, status: status as any } : app
      );
      onUpdateAppointments(updatedAppointments);
      
      await sendSystemNotification(
        'Appointment Statuses Updated',
        `${selectedAppointments.length} appointments have been updated to ${status}.`
      );

      setSelectedAppointments([]);
      setSelectAll(false);
    }
  };

  const exportToSheet = (data: any[], fileName: string, fileType: 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
      XLSX.writeFile(wb, `${fileName}.${fileType}`);
      toast.success(`Exported to ${fileName}.${fileType}`);
      logActivity(`Exported appointments to ${fileType}`);
    } catch (error) {
      toast.error('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL appointments? This action cannot be undone.')) {
        const { error } = await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            toast.error('Failed to clear all appointments.');
        } else {
            toast.success('All appointments have been cleared.');
            await logActivity('Cleared all appointments');
            onUpdateAppointments([]);
        }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.info("Import functionality is not yet implemented.");
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        onImport={handleImportClick}
        onExportCSV={() => exportToSheet(filteredAppointments, 'appointments', 'csv')}
        onExportXLSX={() => exportToSheet(filteredAppointments, 'appointments', 'xlsx')}
        onClearAll={handleClearAll}
        isExporting={isExporting}
        filteredAppointmentsLength={filteredAppointments.length}
        onNewAppointmentClick={onNewAppointmentClick}
        fileInputRef={fileInputRef}
        isImporting={isImporting}
      />
      <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv, .xlsx" />
      <AppointmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />
      <BulkActions
        selectedAppointments={selectedAppointments}
        selectAll={selectAll}
        onSelectAll={handleSelectAll}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
      />
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(appointment => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    isSelected={selectedAppointments.includes(appointment.id)}
                    onSelect={(checked) => handleSelect(appointment.id, checked as boolean)}
                    onEdit={onEditAppointmentClick}
                    onDelete={handleDelete}
                    customFields={customFields}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No appointments match the current filters.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsTab;