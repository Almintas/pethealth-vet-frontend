import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { MY_APPOINTMENTS_QUERY } from '../../appointments/graphql';
import type { MyAppointmentsQueryResult } from '../../appointments/types';
import { mapAppointmentsToDashboard } from '../../appointments/utils/map-to-dashboard';
import { useAuth, getVeterinarianFirstName } from '../../auth';
import {
  DashboardAppointmentList,
} from '../components/DashboardAppointmentList';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { DashboardSection } from '../components/DashboardSection';
import '../dashboard.css';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const firstName = getVeterinarianFirstName(user) || t('common.account');

  const { data } = useQuery<MyAppointmentsQueryResult>(MY_APPOINTMENTS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { today: todayAppointments, upcoming: upcomingAppointments } = useMemo(
    () => mapAppointmentsToDashboard(data?.myAppointments ?? [], i18n.language),
    [data?.myAppointments, i18n.language],
  );
  const recentPatients: unknown[] = [];

  return (
    <div className="ph-page dashboard">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="ph-page-header__title">
            {t('dashboard.greeting', { name: firstName })}
          </h1>
          <p className="ph-page-header__subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </header>

      <div className="dashboard__sections">
        <DashboardSection
          id="dashboard-today-title"
          title={t('dashboard.todayAppointments')}
          prominent
        >
          <DashboardAppointmentList
            appointments={todayAppointments}
            emptyTitle={t('dashboard.todayEmptyTitle')}
            emptyDescription={t('dashboard.todayEmptyDescription')}
          />
        </DashboardSection>

        <div className="dashboard__split">
          <DashboardSection
            id="dashboard-upcoming-title"
            title={t('dashboard.upcomingAppointments')}
          >
            <DashboardAppointmentList
              appointments={upcomingAppointments}
              emptyTitle={t('dashboard.upcomingEmptyTitle')}
              emptyDescription={t('dashboard.upcomingEmptyDescription')}
            />
          </DashboardSection>

          <DashboardSection
            id="dashboard-recent-patients-title"
            title={t('dashboard.recentPatients')}
          >
            {recentPatients.length === 0 ? (
              <EmptyState
                section
                title={t('dashboard.recentPatientsEmptyTitle')}
                description={t('dashboard.recentPatientsEmptyDescription')}
              />
            ) : null}
          </DashboardSection>
        </div>

        <DashboardSection
          id="dashboard-quick-actions-title"
          title={t('dashboard.quickActions.title')}
        >
          <DashboardQuickActions />
        </DashboardSection>
      </div>
    </div>
  );
}
