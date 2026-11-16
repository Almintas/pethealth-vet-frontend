import { useMutation, useQuery } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { formatMedicalRecordDate } from '../../medical-records/utils/medical-record-display';
import type { Patient } from '../../patients/types';
import {
  CREATE_VET_REMINDER_MUTATION,
  DELETE_VET_REMINDER_MUTATION,
  PATIENT_REMINDERS_QUERY,
} from '../graphql';
import {
  VET_REMINDER_TYPES,
  reminderDueAtFromDateInput,
  sortReminders,
  type PatientRemindersQueryResult,
  type VetPatientReminder,
  type VetReminderType,
} from '../types';
import '../../medical-records/components/medical-history.css';
import './owner-reminders-section.css';

type OwnerRemindersSectionProps = {
  patient: Patient;
  clinics: { id: string; name: string }[];
};

type FormState = {
  type: VetReminderType;
  title: string;
  date: string;
  message: string;
};

const EMPTY_FORM: FormState = { type: 'APPOINTMENT', title: '', date: '', message: '' };

/**
 * Reminders the clinic sets for the pet owner (follow-up visit, repeat
 * medication…), plus automatic ones from vaccination due dates. The owner
 * sees them in their app and gets email for vaccination/medication ones.
 */
export function OwnerRemindersSection({ patient, clinics }: OwnerRemindersSectionProps) {
  const { t, i18n } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const accessibleClinicIds = new Set(patient.clinicAccesses.map((access) => access.clinicId));
  const myClinicIds = clinics.filter((clinic) => accessibleClinicIds.has(clinic.id)).map((clinic) => clinic.id);
  const clinicId = myClinicIds[0] ?? null;

  const { data, loading, error, refetch } = useQuery<PatientRemindersQueryResult>(PATIENT_REMINDERS_QUERY, {
    variables: { patientId: patient.id },
    fetchPolicy: 'cache-and-network',
  });
  const [createReminder, createState] = useMutation(CREATE_VET_REMINDER_MUTATION);
  const [deleteReminder, deleteState] = useMutation(DELETE_VET_REMINDER_MUTATION);

  const reminders = sortReminders(data?.patientReminders ?? []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!clinicId) {
      return;
    }
    const dueAt = reminderDueAtFromDateInput(form.date);
    if (!form.title.trim() || !dueAt) {
      setFormError(t('ownerReminders.validation'));
      return;
    }
    setFormError(null);
    try {
      await createReminder({
        variables: {
          input: {
            clinicId,
            petId: patient.id,
            type: form.type,
            title: form.title.trim(),
            message: form.message.trim() || undefined,
            dueAt,
          },
        },
      });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      void refetch();
    } catch {
      setFormError(t('ownerReminders.saveFailed'));
    }
  };

  const handleDelete = async (reminder: VetPatientReminder) => {
    if (!reminder.clinicId || !window.confirm(t('ownerReminders.removeConfirm', { title: reminder.title }))) {
      return;
    }
    setActionError(null);
    try {
      await deleteReminder({
        variables: { id: reminder.id, clinicId: reminder.clinicId, patientId: patient.id },
      });
      void refetch();
    } catch {
      setActionError(t('ownerReminders.removeFailed'));
    }
  };

  const origin = (reminder: VetPatientReminder) =>
    reminder.managedBy === 'AUTOMATIC'
      ? t('ownerReminders.automatic')
      : [reminder.clinicName, reminder.createdByName].filter(Boolean).join(' · ');

  return (
    <section className="patient-profile__block owner-reminders" aria-labelledby="owner-reminders-heading">
      <div className="medical-history__header">
        <h2 id="owner-reminders-heading" className="medical-history__title">
          {t('ownerReminders.title')}
        </h2>
        {clinicId && !isFormOpen ? (
          <button type="button" className="ph-button ph-button--primary" onClick={() => setIsFormOpen(true)}>
            {t('ownerReminders.add')}
          </button>
        ) : null}
      </div>
      <p className="owner-reminders__intro">{t('ownerReminders.intro')}</p>

      {isFormOpen && clinicId ? (
        <form className="owner-reminders__form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {formError ? (
            <p className="owner-reminders__error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="owner-reminders__row">
            <label className="ph-field">
              <span className="ph-field__label">{t('ownerReminders.type')}</span>
              <select
                className="ph-field__select"
                value={form.type}
                disabled={createState.loading}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as VetReminderType }))
                }
              >
                {VET_REMINDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`ownerReminders.types.${type}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="ph-field">
              <span className="ph-field__label">{t('ownerReminders.date')}</span>
              <input
                type="date"
                className="ph-field__input"
                value={form.date}
                disabled={createState.loading}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
          </div>
          <label className="ph-field">
            <span className="ph-field__label">{t('ownerReminders.reminderTitle')}</span>
            <input
              type="text"
              className="ph-field__input"
              value={form.title}
              maxLength={200}
              placeholder={t('ownerReminders.titlePlaceholder')}
              disabled={createState.loading}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="ph-field">
            <span className="ph-field__label">{t('ownerReminders.note')}</span>
            <textarea
              className="ph-field__textarea"
              rows={2}
              value={form.message}
              maxLength={2000}
              disabled={createState.loading}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
          </label>
          <div className="owner-reminders__actions">
            <button
              type="button"
              className="ph-button ph-button--secondary"
              disabled={createState.loading}
              onClick={() => {
                setIsFormOpen(false);
                setForm(EMPTY_FORM);
                setFormError(null);
              }}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="ph-button ph-button--primary" disabled={createState.loading}>
              {createState.loading ? t('common.saving') : t('ownerReminders.save')}
            </button>
          </div>
        </form>
      ) : null}

      {loading && reminders.length === 0 ? (
        <LoadingState message={t('ownerReminders.loading')} skeleton skeletonLines={2} />
      ) : null}

      {error ? (
        <ErrorAlert
          title={t('ownerReminders.loadErrorTitle')}
          message={t('ownerReminders.loadErrorDescription')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {actionError ? (
        <p className="owner-reminders__error" role="alert">
          {actionError}
        </p>
      ) : null}

      {!loading && !error && reminders.length === 0 ? (
        <p className="owner-reminders__empty">{t('ownerReminders.empty')}</p>
      ) : null}

      {reminders.length > 0 ? (
        <ul className="owner-reminders__list">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="owner-reminders__item">
              <div className="owner-reminders__main">
                <p className="owner-reminders__title">{reminder.title}</p>
                <p className="owner-reminders__meta">
                  {[
                    t(`ownerReminders.types.${reminder.type}`, { defaultValue: reminder.type }),
                    formatMedicalRecordDate(reminder.dueAt, i18n.language),
                    origin(reminder),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {reminder.message ? <p className="owner-reminders__message">{reminder.message}</p> : null}
              </div>
              <div className="owner-reminders__side">
                <span className={`owner-reminders__status owner-reminders__status--${reminder.status.toLowerCase()}`}>
                  {t(`ownerReminders.status.${reminder.status}`, { defaultValue: reminder.status })}
                </span>
                {reminder.managedBy === 'CLINIC' && reminder.clinicId && myClinicIds.includes(reminder.clinicId) ? (
                  <button
                    type="button"
                    className="ph-button ph-button--secondary owner-reminders__remove"
                    disabled={deleteState.loading}
                    onClick={() => void handleDelete(reminder)}
                    aria-label={`${t('ownerReminders.remove')}: ${reminder.title}`}
                  >
                    {t('ownerReminders.remove')}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
