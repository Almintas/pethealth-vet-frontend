import { useMutation, useQuery } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { datetimeLocalInputToIso, isoToDatetimeLocalInput } from '../../../utils/datetime-local-input';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import { MY_CLINICS_QUERY } from '../../clinics/graphql';
import type { MyClinicsQueryResult } from '../../clinics/types';
import { MY_PATIENTS_QUERY } from '../../patients/graphql';
import type { MyPatientsQueryResult } from '../../patients/types';
import {
  APPOINTMENT_TYPE_OPTIONS,
  DEFAULT_APPOINTMENT_TYPE,
  normalizeAppointmentTypeValue,
  type AppointmentTypeValue,
} from '../constants/appointment-types';
import {
  CREATE_VET_APPOINTMENT_MUTATION,
  UPDATE_VET_APPOINTMENT_MUTATION,
} from '../graphql';
import {
  myAppointmentsRefetchList,
  upsertMyAppointmentsCache,
} from '../utils/my-appointments-cache';
import {
  datetimeLocalBoundsForScheduleDay,
  datetimeLocalForScheduleDay,
  selectedDayIsoDate,
} from '../utils/schedule-day';
import type {
  AppointmentStatus,
  AppointmentsScheduleQueryInput,
  CreateVetAppointmentInput,
  UpdateVetAppointmentInput,
  VetAppointment,
} from '../types';
import '../../patients/components/patient-form-dialog.css';

type AppointmentFormDialogProps = {
  mode: 'add' | 'edit';
  open: boolean;
  onClose: () => void;
  appointment?: VetAppointment;
  defaultPetId?: string;
  defaultScheduleDay?: Date;
  scheduleDayLock?: Date;
  scheduleQuery?: AppointmentsScheduleQueryInput;
  onSaved?: () => void | Promise<void>;
};

type FormState = {
  clinicId: string;
  petId: string;
  scheduledAt: string;
  type: AppointmentTypeValue;
  reason: string;
  notes: string;
  status: AppointmentStatus;
};

function buildInitialForm(
  mode: 'add' | 'edit',
  appointment?: VetAppointment,
  defaultClinicId = '',
  defaultPetId = '',
  defaultScheduleDay?: Date,
): FormState {
  if (mode === 'edit' && appointment) {
    return {
      clinicId: appointment.clinicId ?? defaultClinicId,
      petId: appointment.petId,
      scheduledAt: isoToDatetimeLocalInput(appointment.scheduledAt),
      type: normalizeAppointmentTypeValue(appointment.type),
      reason: appointment.reason ?? '',
      notes: appointment.notes ?? '',
      status: appointment.status,
    };
  }
  return {
    clinicId: defaultClinicId,
    petId: defaultPetId,
    scheduledAt: defaultScheduleDay
      ? datetimeLocalForScheduleDay(defaultScheduleDay)
      : '',
    type: DEFAULT_APPOINTMENT_TYPE,
    reason: '',
    notes: '',
    status: 'SCHEDULED',
  };
}

export function AppointmentFormDialog({
  mode,
  open,
  onClose,
  appointment,
  defaultPetId,
  defaultScheduleDay,
  scheduleDayLock,
  scheduleQuery,
  onSaved,
}: AppointmentFormDialogProps) {
  const { data: clinicsData } = useQuery<MyClinicsQueryResult>(MY_CLINICS_QUERY, {
    skip: !open,
  });
  const clinics = clinicsData?.myClinics ?? [];
  const defaultClinicId = clinics.length === 1 ? clinics[0]?.id ?? '' : '';

  if (!open) {
    return null;
  }

  const formKey = [
    mode,
    appointment?.id ?? 'new',
    defaultClinicId,
    scheduleDayLock ? selectedDayIsoDate(scheduleDayLock) : 'any-day',
  ].join('-');

  return (
    <AppointmentFormDialogContent
      key={formKey}
      mode={mode}
      onClose={onClose}
      appointment={appointment}
      clinics={clinics}
      defaultClinicId={defaultClinicId}
      scheduleDayLock={scheduleDayLock}
      scheduleQuery={scheduleQuery}
      initialForm={buildInitialForm(
        mode,
        appointment,
        defaultClinicId,
        defaultPetId,
        defaultScheduleDay,
      )}
      onSaved={onSaved}
    />
  );
}

type ContentProps = {
  mode: 'add' | 'edit';
  onClose: () => void;
  appointment?: VetAppointment;
  clinics: MyClinicsQueryResult['myClinics'];
  defaultClinicId: string;
  scheduleDayLock?: Date;
  scheduleQuery?: AppointmentsScheduleQueryInput;
  initialForm: FormState;
  onSaved?: () => void | Promise<void>;
};

function AppointmentFormDialogContent({
  mode,
  onClose,
  appointment,
  clinics,
  initialForm,
  scheduleDayLock,
  scheduleQuery,
  onSaved,
}: ContentProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialForm);

  const { data: patientsData } = useQuery<MyPatientsQueryResult>(MY_PATIENTS_QUERY);
  const patients = patientsData?.myPatients ?? [];

  const [createAppointment, createState] = useMutation<
    { createVetAppointment: VetAppointment },
    { input: CreateVetAppointmentInput }
  >(CREATE_VET_APPOINTMENT_MUTATION);

  const [updateAppointment, updateState] = useMutation<
    { updateVetAppointment: VetAppointment },
    { id: string; input: UpdateVetAppointmentInput }
  >(UPDATE_VET_APPOINTMENT_MUTATION);

  const saving = createState.loading || updateState.loading;
  const error = createState.error ?? updateState.error;
  const dateTimeBounds = scheduleDayLock
    ? datetimeLocalBoundsForScheduleDay(scheduleDayLock)
    : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const mutationOptions = {
      refetchQueries: myAppointmentsRefetchList(scheduleQuery),
      awaitRefetchQueries: true,
    };

    try {
      if (mode === 'add') {
        const result = await createAppointment({
          ...mutationOptions,
          variables: {
            input: {
              clinicId: form.clinicId,
              petId: form.petId,
              scheduledAt: datetimeLocalInputToIso(form.scheduledAt),
              type: form.type,
              reason: form.reason.trim() || undefined,
              notes: form.notes.trim() || undefined,
              status: form.status,
            },
          },
          update: (cache, { data }) => {
            const created = data?.createVetAppointment;
            if (created) {
              upsertMyAppointmentsCache(cache, created, { scheduleQuery });
            }
          },
        });
        if (!result.data?.createVetAppointment) {
          return;
        }
      } else if (appointment) {
        const result = await updateAppointment({
          ...mutationOptions,
          variables: {
            id: appointment.id,
            input: {
              scheduledAt: datetimeLocalInputToIso(form.scheduledAt),
              type: form.type,
              reason: form.reason.trim() || undefined,
              notes: form.notes.trim() || undefined,
              status: form.status,
            },
          },
          update: (cache, { data }) => {
            const updated = data?.updateVetAppointment;
            if (updated) {
              upsertMyAppointmentsCache(cache, updated, { scheduleQuery });
            }
          },
        });
        if (!result.data?.updateVetAppointment) {
          return;
        }
      }
      await onSaved?.();
      onClose();
    } catch {
      // mutation error shown below
    }
  };

  const title =
    mode === 'add' ? t('appointments.newAppointment') : t('appointments.editAppointment');

  return (
    <div className="patient-form-dialog__backdrop" role="presentation">
      <div
        className="patient-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 id="appointment-form-title" className="patient-form-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="patient-form-dialog__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        {mode === 'add' && patients.length === 0 ? (
          <div className="ph-feedback ph-empty-state ph-empty-state--section">
            <p className="ph-empty-state__title">{t('appointments.noPatientsAvailable')}</p>
            <p className="ph-empty-state__description">
              {t('appointments.noPatientsAvailableDescription')}
            </p>
            <Link className="ph-empty-state__action" to="/patients">
              {t('appointments.goToPatients')}
            </Link>
          </div>
        ) : (
          <form className="patient-form-dialog__form" onSubmit={(event) => void handleSubmit(event)}>
            {mode === 'add' && clinics.length > 1 ? (
              <label className="ph-field">
                <span className="ph-field__label">{t('patients.clinic')}</span>
                <select
                  className="ph-field__input"
                  value={form.clinicId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, clinicId: event.target.value }))
                  }
                  required
                >
                  <option value="">{t('patients.selectClinic')}</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {mode === 'add' ? (
              <label className="ph-field">
                <span className="ph-field__label">{t('appointments.patient')}</span>
                <select
                  className="ph-field__input"
                  value={form.petId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, petId: event.target.value }))
                  }
                  required
                >
                  <option value="">{t('appointments.selectPatient')}</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.species}
                      {patient.breed ? ` · ${patient.breed}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="ph-field">
              <span className="ph-field__label">{t('appointments.dateTime')}</span>
              <input
                type="datetime-local"
                className="ph-field__input"
                value={form.scheduledAt}
                min={dateTimeBounds?.min}
                max={dateTimeBounds?.max}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scheduledAt: event.target.value }))
                }
                required
              />
            </label>

            <label className="ph-field">
              <span className="ph-field__label">{t('appointments.appointmentType')}</span>
              <select
                className="ph-field__input"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as AppointmentTypeValue,
                  }))
                }
              >
                {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`enums.appointmentType.${option.value}`)}
                  </option>
                ))}
              </select>
            </label>

            {mode === 'edit' ? (
              <label className="ph-field">
                <span className="ph-field__label">{t('appointments.status')}</span>
                <select
                  className="ph-field__input"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as AppointmentStatus,
                    }))
                  }
                >
                  {(['SCHEDULED', 'COMPLETED', 'CANCELLED'] as AppointmentStatus[]).map(
                    (status) => (
                      <option key={status} value={status}>
                        {t(`enums.appointmentStatus.${status}`)}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : null}

            <label className="ph-field">
              <span className="ph-field__label">{t('appointments.reason')}</span>
              <input
                type="text"
                className="ph-field__input"
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
              />
            </label>

            <label className="ph-field">
              <span className="ph-field__label">{t('appointments.notes')}</span>
              <textarea
                className="ph-field__input"
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>

            {error ? (
              <ErrorAlert
                compact
                message={getAuthErrorMessage(error, 'generic-save')}
              />
            ) : null}

            <div className="patient-form-dialog__actions">
              <button
                type="button"
                className="ph-button ph-button--secondary"
                onClick={onClose}
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="ph-button ph-button--primary"
                disabled={
                  saving ||
                  (mode === 'add' &&
                    (!form.clinicId || !form.petId) &&
                    clinics.length > 0)
                }
              >
                {saving ? t('common.saving') : t('appointments.saveChanges')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
