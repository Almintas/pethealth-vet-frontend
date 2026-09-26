import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { normalizeAppointmentTypeValue } from '../constants/appointment-types';
import { CANCEL_VET_APPOINTMENT_MUTATION, MY_APPOINTMENTS_QUERY } from '../graphql';
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
};

export function AppointmentDetailDialog({
  appointment,
  onClose,
  onEdit,
}: AppointmentDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const [cancelAppointment, cancelState] = useMutation(CANCEL_VET_APPOINTMENT_MUTATION, {
    refetchQueries: [{ query: MY_APPOINTMENTS_QUERY }],
  });

  if (!appointment) {
    return null;
  }

  const handleCancel = async () => {
    await cancelAppointment({ variables: { id: appointment.id } });
    onClose();
  };

  const typeKey = normalizeAppointmentTypeValue(appointment.type);

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

        <p className="appointment-row__meta">{getSpeciesTypeLine(appointment)}</p>

        <div className="patient-form-dialog__actions">
          <Link className="ph-link-button" to={`/patients/${appointment.petId}`}>
            {t('appointments.viewPatient')}
          </Link>
          {appointment.status !== 'CANCELLED' ? (
            <button
              type="button"
              className="ph-button ph-button--secondary"
              onClick={() => onEdit(appointment)}
            >
              {t('appointments.editAppointment')}
            </button>
          ) : null}
          {appointment.status === 'SCHEDULED' ? (
            <button
              type="button"
              className="ph-button ph-button--secondary"
              onClick={() => void handleCancel()}
              disabled={cancelState.loading}
            >
              {t('appointments.cancelAppointment')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
