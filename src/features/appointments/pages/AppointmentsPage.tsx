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
import { startOfLocalDay } from '../utils/appointment-display';
import { filterAppointments } from '../utils/filter-appointments';
import {
  addLocalDays,
  formatScheduleDayTitle,
  formatSelectedDayHeading,
  isToday,
  localDayRangeIso,
  selectedDayIsoDate,
} from '../utils/schedule-day';
import '../components/appointment-schedule.css';

const EMPTY_APPOINTMENTS: VetAppointment[] = [];

export function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string | 'ALL'>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editAppointment, setEditAppointment] = useState<VetAppointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<VetAppointment | null>(null);

  const scheduleQuery = useMemo(
    () => localDayRangeIso(selectedDay),
    [selectedDay],
  );

  const { data, loading, error, refetch } = useQuery<MyAppointmentsQueryResult>(
    MY_APPOINTMENTS_QUERY,
    {
      variables: { query: scheduleQuery },
      fetchPolicy: 'cache-and-network',
    },
  );

  const appointmentsForSelectedDay = data?.myAppointments ?? EMPTY_APPOINTMENTS;
  const hasAnyAppointments = appointmentsForSelectedDay.length > 0;

  const filtered = useMemo(
    () =>
      filterAppointments(appointmentsForSelectedDay, {
        searchTerm,
        status: statusFilter,
        type: typeFilter,
      }),
    [appointmentsForSelectedDay, searchTerm, statusFilter, typeFilter],
  );

  const isInitialLoading = loading && appointmentsForSelectedDay.length === 0;
  const hasFilters =
    searchTerm.trim().length > 0 || statusFilter !== 'ALL' || typeFilter !== 'ALL';
  const showTrueEmpty =
    !isInitialLoading && !error && !hasAnyAppointments && isToday(selectedDay);
  const showDayEmpty =
    !isInitialLoading &&
    !error &&
    !showTrueEmpty &&
    filtered.length === 0 &&
    !hasFilters;
  const showFilteredEmpty =
    !isInitialLoading &&
    !error &&
    appointmentsForSelectedDay.length > 0 &&
    filtered.length === 0 &&
    hasFilters;

  const scheduleSectionTitle = formatScheduleDayTitle(selectedDay, i18n.language, {
    today: t('appointments.today'),
    tomorrow: t('appointments.tomorrow'),
  });
  const selectedDayHeading = formatSelectedDayHeading(selectedDay, i18n.language);

  return (
    <div className="ph-page appointments-page">
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

      <section className="appointments-page__controls ph-card ph-card--pad" aria-label={t('appointments.scheduleControlsLabel')}>
        <nav className="appointments-day-nav" aria-label={t('appointments.dayNavigationLabel')}>
          <button
            type="button"
            className="ph-button ph-button--secondary appointments-day-nav__prev"
            onClick={() => setSelectedDay((current) => addLocalDays(current, -1))}
          >
            {t('appointments.previousDay')}
          </button>

          <time
            className="appointments-day-nav__date"
            dateTime={selectedDayIsoDate(selectedDay)}
          >
            {selectedDayHeading}
          </time>

          <div className="appointments-day-nav__actions">
            <button
              type="button"
              className="ph-button ph-button--secondary appointments-day-nav__today"
              onClick={() => setSelectedDay(startOfLocalDay(new Date()))}
              disabled={isToday(selectedDay)}
            >
              {t('appointments.today')}
            </button>
            <button
              type="button"
              className="ph-button ph-button--secondary"
              onClick={() => setSelectedDay((current) => addLocalDays(current, 1))}
            >
              {t('appointments.nextDay')}
            </button>
          </div>
        </nav>

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
      </section>

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

      {showDayEmpty ? (
        <div className="appointments-page__day-empty">
          <EmptyState
            title={t('appointments.dayEmptyTitle')}
            description={t('appointments.dayEmptyDescription')}
            actionLabel={t('appointments.newAppointmentAction')}
            onAction={() => setIsAddOpen(true)}
          />
        </div>
      ) : null}

      {showFilteredEmpty ? (
        <div className="appointments-page__day-empty">
          <EmptyState
            title={t('appointments.searchEmptyTitle')}
            description={t('appointments.searchEmptyDescription')}
          />
        </div>
      ) : null}

      {!error && filtered.length > 0 ? (
        <AppointmentSchedule
          title={scheduleSectionTitle}
          appointments={filtered}
          onSelect={setSelectedAppointment}
          showViewPatientLink
        />
      ) : null}

      <AppointmentFormDialog
        mode="add"
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultScheduleDay={selectedDay}
        scheduleDayLock={selectedDay}
        scheduleQuery={scheduleQuery}
        onSaved={() => void refetch()}
      />
      <AppointmentFormDialog
        mode="edit"
        open={Boolean(editAppointment)}
        onClose={() => setEditAppointment(null)}
        appointment={editAppointment ?? undefined}
        scheduleDayLock={selectedDay}
        scheduleQuery={scheduleQuery}
        onSaved={() => void refetch()}
      />
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        scheduleQuery={scheduleQuery}
        onClose={() => setSelectedAppointment(null)}
        onEdit={(appointment) => {
          setSelectedAppointment(null);
          setEditAppointment(appointment);
        }}
      />
    </div>
  );
}
