import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { normalizeAppointmentTypeValue } from '../constants/appointment-types';
import {
  CANCEL_VET_APPOINTMENT_MUTATION,
  UPDATE_VET_APPOINTMENT_MUTATION,
} from '../graphql';
import {
  myAppointmentsRefetchList,
  upsertMyAppointmentsCache,
} from '../utils/my-appointments-cache';
import type { AppointmentsScheduleQueryInput } from '../types';
import type { VetAppointment } from '../types';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getOwnerFullName,
  getSpeciesTypeLine,
} from '../utils/appointment-display';
import '../../patients/components/patient-form-dialog.css';
import '../../patients/components/patient-profile.css';

type AppointmentDetailDialogProps = {
  appointment: VetAppointment | null;
  onClose: () => void;
  onEdit: (appointment: VetAppointment) => void;
  scheduleQuery?: AppointmentsScheduleQueryInput;
};

export function AppointmentDetailDialog({
  appointment,
  onClose,
  onEdit,
  scheduleQuery,
}: AppointmentDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [cancelAppointment, cancelState] = useMutation<
    { cancelVetAppointment: VetAppointment },
    { id: string }
  >(CANCEL_VET_APPOINTMENT_MUTATION);
  const [updateAppointment, completeState] = useMutation<
    { updateVetAppointment: VetAppointment },
    { id: string; input: { status: VetAppointment['status'] } }
  >(UPDATE_VET_APPOINTMENT_MUTATION);

  if (!appointment) {
    return null;
  }

  const handleCancel = async () => {
    const result = await cancelAppointment({
      variables: { id: appointment.id },
      refetchQueries: myAppointmentsRefetchList(scheduleQuery),
      awaitRefetchQueries: true,
      update: (cache, { data }) => {
        const cancelled = data?.cancelVetAppointment;
        if (cancelled) {
          upsertMyAppointmentsCache(cache, cancelled, { scheduleQuery });
        }
      },
    });
    if (!result.data?.cancelVetAppointment) {
      return;
    }
    setShowCancelConfirm(false);
    onClose();
  };

  const handleComplete = async () => {
    const result = await updateAppointment({
      variables: {
        id: appointment.id,
        input: { status: 'COMPLETED' },
      },
      refetchQueries: myAppointmentsRefetchList(scheduleQuery),
      awaitRefetchQueries: true,
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
    onClose();
  };

  const typeKey = normalizeAppointmentTypeValue(appointment.type);
  const saving = cancelState.loading || completeState.loading;

  return (
    <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="patient-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 className="patient-form-dialog__title">{appointment.patient.name}</h2>
          <button
            type="button"
            className="patient-form-dialog__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <dl className="patient-profile__details">
          <div>
            <dt>{t('appointments.dateTime')}</dt>
            <dd>
              {formatAppointmentDate(appointment.scheduledAt, i18n.language)}{' '}
              {formatAppointmentTime(appointment.scheduledAt, i18n.language)}
            </dd>
          </div>
          <div>
            <dt>{t('appointments.appointmentType')}</dt>
            <dd>{t(`enums.appointmentType.${typeKey}`)}</dd>
          </div>
          <div>
            <dt>{t('appointments.status')}</dt>
            <dd>{t(`enums.appointmentStatus.${appointment.status}`)}</dd>
          </div>
          <div>
            <dt>{t('patients.owner')}</dt>
            <dd>{getOwnerFullName(appointment)}</dd>
          </div>
          {appointment.clinicName ? (
            <div>
              <dt>{t('patients.clinic')}</dt>
              <dd>{appointment.clinicName}</dd>
            </div>
          ) : null}
          {appointment.veterinarianName ? (
            <div>
              <dt>{t('appointments.veterinarian')}</dt>
              <dd>{appointment.veterinarianName}</dd>
            </div>
          ) : null}
          {appointment.reason ? (
            <div>
              <dt>{t('appointments.reason')}</dt>
              <dd>{appointment.reason}</dd>
            </div>
          ) : null}
        </dl>

        <p className="appointment-row__meta">{getSpeciesTypeLine(appointment, t)}</p>

        {showCancelConfirm ? (
          <div className="appointment-confirm" role="alertdialog" aria-labelledby="cancel-title">
            <h3 id="cancel-title" className="appointment-confirm__title">
              {t('appointments.cancelConfirmTitle')}
            </h3>
            <p>{t('appointments.cancelConfirmDescription')}</p>
            <div className="patient-form-dialog__actions">
              <button
                type="button"
                className="ph-button ph-button--secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={saving}
              >
                {t('appointments.keepAppointment')}
              </button>
              <button
                type="button"
                className="ph-button ph-button--primary"
                onClick={() => void handleCancel()}
                disabled={saving}
              >
                {t('appointments.cancelAppointment')}
              </button>
            </div>
          </div>
        ) : (
          <div className="patient-form-dialog__actions">
            <Link className="ph-link-button" to={`/patients/${appointment.petId}`}>
              {t('appointments.viewPatient')}
            </Link>
            {appointment.status === 'COMPLETED' ? (
              <Link
                className="ph-link-button"
                to={`/patients/${appointment.petId}/medical-history`}
              >
                {t('appointments.addMedicalRecord')}
              </Link>
            ) : null}
            {appointment.status !== 'CANCELLED' ? (
              <button
                type="button"
                className="ph-button ph-button--secondary"
                onClick={() => onEdit(appointment)}
                disabled={saving}
              >
                {t('appointments.editAppointment')}
              </button>
            ) : null}
            {appointment.status === 'SCHEDULED' ? (
              <>
                <button
                  type="button"
                  className="ph-button ph-button--secondary"
                  onClick={() => void handleComplete()}
                  disabled={saving}
                >
                  {t('appointments.markCompleted')}
                </button>
                <button
                  type="button"
                  className="ph-button ph-button--secondary"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={saving}
                >
                  {t('appointments.cancelAppointment')}
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
