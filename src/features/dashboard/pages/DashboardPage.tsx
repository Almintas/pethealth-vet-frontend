import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MY_APPOINTMENTS_QUERY } from '../../appointments/graphql';
import type { MyAppointmentsQueryResult } from '../../appointments/types';
import { mapAppointmentsToDashboard } from '../../appointments/utils/map-to-dashboard';
import { useAuth, getVeterinarianFirstName } from '../../auth';
import {
  DashboardAppointmentList,
} from '../components/DashboardAppointmentList';
import { Link } from 'react-router';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { MY_PATIENTS_QUERY } from '../../patients/graphql';
import type { MyPatientsQueryResult } from '../../patients/types';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { DashboardRecentPatients } from '../components/DashboardRecentPatients';
import { selectRecentPatients } from '../utils/recent-patients';
import { getGreetingPeriod } from '../utils/greeting';
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
  const { data: patientsData } = useQuery<MyPatientsQueryResult>(MY_PATIENTS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const recentPatients = useMemo(
    () => selectRecentPatients(patientsData?.myPatients ?? []),
    [patientsData?.myPatients],
  );
  const greetingPeriod = getGreetingPeriod();
  const { data: clinicsData } = useQuery<MyClinicsQueryResult>(MY_CLINICS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const hasNoClinic = clinicsData !== undefined && clinicsData.myClinics.length === 0;

  return (
    <div className="ph-page dashboard">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="ph-page-header__title">
            {t(`dashboard.greeting.${greetingPeriod}`, { name: firstName })}
          </h1>
          <p className="ph-page-header__subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </header>

      {hasNoClinic ? (
        <div className="dashboard__setup-callout" role="status">
          <div>
            <p className="dashboard__setup-title">{t('dashboard.setupClinic.title')}</p>
            <p className="dashboard__setup-text">{t('dashboard.setupClinic.text')}</p>
          </div>
          <Link className="ph-button ph-button--primary" to="/clinics">
            {t('dashboard.setupClinic.action')}
          </Link>
        </div>
      ) : null}

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
            <DashboardRecentPatients patients={recentPatients} />
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
