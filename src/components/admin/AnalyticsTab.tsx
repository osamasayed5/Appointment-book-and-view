import AdminDashboardStats from '../AdminDashboardStats';
import AnalyticsCharts from './AnalyticsCharts';
import { Appointment } from '@/types';
import { useMemo } from 'react';

interface AnalyticsTabProps {
  appointments: Appointment[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ appointments }) => {
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter(app => app.status === 'confirmed').length,
      pending: appointments.filter(app => app.status === 'pending').length,
      cancelled: appointments.filter(app => app.status === 'cancelled').length,
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      <AdminDashboardStats appointments={appointments} />
      <AnalyticsCharts stats={stats} appointments={appointments} />
    </div>
  );
};

export default AnalyticsTab;