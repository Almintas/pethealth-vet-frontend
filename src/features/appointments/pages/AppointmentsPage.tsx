import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { EmptyStateIcon } from '../../../components/feedback/EmptyStateIcon';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { APPOINTMENT_TYPE_OPTIONS } from '../constants/appointment-types';
import { AppointmentDetailDialog } from '../components/AppointmentDetailDialog';
import { AppointmentFormDialog } from '../components/AppointmentFormDialog';
import { AppointmentSchedule } from '../components/AppointmentSchedule';
import { MY_APPOINTMENTS_QUERY } from '../graphql';
import type { AppointmentStatus, MyAppointmentsQueryResult, VetAppointment } from '../types';
import { filterAppointments } from '../utils/filter-appointments';
import { groupAppointments } from '../utils/group-appointments';
import '../components/appointment-schedule.css';

const EMPTY_APPOINTMENTS: VetAppointment[] = [];

export function AppointmentsPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string | 'ALL'>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editAppointment, setEditAppointment] = useState<VetAppointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<VetAppointment | null>(null);

  const { data, loading, error, refetch } = useQuery<MyAppointmentsQueryResult>(
    MY_APPOINTMENTS_QUERY,
    { fetchPolicy: 'cache-and-network' },
  );

  const appointments = data?.myAppointments ?? EMPTY_APPOINTMENTS;
  const filtered = useMemo(
    () =>
      filterAppointments(appointments, {
        searchTerm,
        status: statusFilter,
        type: typeFilter,
      }),
    [appointments, searchTerm, statusFilter, typeFilter],
  );
  const grouped = useMemo(() => groupAppointments(filtered), [filtered]);

  const isInitialLoading = loading && appointments.length === 0;
  const hasFilters =
    searchTerm.trim().length > 0 || statusFilter !== 'ALL' || typeFilter !== 'ALL';
  const showTrueEmpty = !isInitialLoading && !error && appointments.length === 0;
  const showFilteredEmpty =
    !isInitialLoading && !error && appointments.length > 0 && filtered.length === 0 && hasFilters;
  const hasVisible =
    grouped.today.length > 0 ||
    grouped.upcoming.length > 0 ||
    grouped.past.length > 0;

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('appointments.eyebrow')}</p>
          <h1 className="ph-page-header__title">{t('appointments.title')}</h1>
          <p className="ph-page-header__subtitle">{t('appointments.subtitle')}</p>
        </div>
        <button
          type="button"
          className="ph-button ph-button--primary"
          onClick={() => setIsAddOpen(true)}
        >
          {t('appointments.newAppointmentAction')}
        </button>
      </header>

      {!isInitialLoading && !error && appointments.length > 0 ? (
        <div className="appointments-toolbar">
          <label className="ph-field appointments-toolbar__search">
            <span className="ph-visually-hidden">{t('appointments.searchLabel')}</span>
            <input
              type="search"
              className="ph-field__input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('appointments.searchPlaceholder')}
              autoComplete="off"
            />
          </label>
          <div className="appointments-toolbar__filters">
            <label className="ph-field appointments-toolbar__filter">
              <span className="ph-field__label">{t('appointments.status')}</span>
              <select
                className="ph-field__input"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AppointmentStatus | 'ALL')
                }
              >
                <option value="ALL">{t('appointments.filterAll')}</option>
                {(['SCHEDULED', 'COMPLETED', 'CANCELLED'] as AppointmentStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {t(`enums.appointmentStatus.${status}`)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="ph-field appointments-toolbar__filter">
              <span className="ph-field__label">{t('appointments.appointmentType')}</span>
              <select
                className="ph-field__input"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">{t('appointments.filterAll')}</option>
                {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`enums.appointmentType.${option.value}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {isInitialLoading ? (
        <LoadingState message={t('appointments.loading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('appointments.loadErrorTitle')}
          message={t('appointments.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {showTrueEmpty ? (
        <EmptyState
          icon={<EmptyStateIcon />}
          title={t('appointments.emptyTitle')}
          description={t('appointments.emptyDescription')}
          actionLabel={t('appointments.newAppointment')}
          onAction={() => setIsAddOpen(true)}
        />
      ) : null}

      {showFilteredEmpty ? (
        <EmptyState
          title={t('appointments.searchEmptyTitle')}
          description={t('appointments.searchEmptyDescription')}
        />
      ) : null}

      {!error && hasVisible ? (
        <>
          <AppointmentSchedule
            title={t('appointments.today')}
            appointments={grouped.today}
            onSelect={setSelectedAppointment}
          />
          <AppointmentSchedule
            title={t('appointments.upcoming')}
            appointments={grouped.upcoming}
            showDateHeaders
            onSelect={setSelectedAppointment}
          />
          <AppointmentSchedule
            title={t('appointments.past')}
            appointments={grouped.past}
            showDateHeaders
            onSelect={setSelectedAppointment}
          />
        </>
      ) : null}

      <AppointmentFormDialog mode="add" open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <AppointmentFormDialog
        mode="edit"
        open={Boolean(editAppointment)}
        onClose={() => setEditAppointment(null)}
        appointment={editAppointment ?? undefined}
      />
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onEdit={(appointment) => {
          setSelectedAppointment(null);
          setEditAppointment(appointment);
        }}
      />
    </div>
  );
}
