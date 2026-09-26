import { useMutation } from '@apollo/client/react';
import type { TFunction } from 'i18next';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import type { Clinic } from '../../clinics/types';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import {
  MY_PATIENTS_QUERY,
  PATIENT_QUERY,
  REGISTER_PATIENT_MUTATION,
  UPDATE_PATIENT_MUTATION,
} from '../graphql';
import type { Patient, RegisterPatientInput, UpdatePatientInput } from '../types';
import {
  getBreedSuggestionsForSpecies,
  PET_GENDER_SUGGESTIONS,
  PET_SPECIES_SUGGESTIONS,
} from '../constants/pet-field-suggestions';
import {
  isCanonicalSpecies,
  resolveCanonicalBreedFromInput,
  resolveCanonicalGenderFromInput,
  resolveCanonicalSpeciesFromInput,
  translatePetBreed,
  translatePetGender,
  translatePetSpecies,
} from '../utils/pet-field-display';
import './patient-form-dialog.css';

type PatientFormDialogProps = {
  mode: 'add' | 'edit';
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: (patientId: string) => void;
  patient?: Patient;
  clinics: Clinic[];
};

type FormState = {
  clinicId: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (clinicId = ''): FormState => ({
  clinicId,
  ownerEmail: '',
  ownerFirstName: '',
  ownerLastName: '',
  name: '',
  species: '',
  breed: '',
  gender: '',
  dateOfBirth: '',
});

function toDateInputValue(iso?: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function buildInitialFormState(
  mode: 'add' | 'edit',
  patient: Patient | undefined,
  defaultClinicId: string,
): FormState {
  if (mode === 'edit' && patient) {
    return {
      clinicId: patient.clinicAccesses[0]?.clinicId ?? defaultClinicId,
      ownerEmail: patient.owner.email ?? '',
      ownerFirstName: patient.owner.firstName,
      ownerLastName: patient.owner.lastName,
      name: patient.name,
      species: patient.species,
      breed: patient.breed ?? '',
      gender: patient.gender ?? '',
      dateOfBirth: toDateInputValue(patient.dateOfBirth),
    };
  }
  return emptyForm(defaultClinicId);
}

function normalizePetFormState(form: FormState, t: TFunction): FormState {
  const species = resolveCanonicalSpeciesFromInput(form.species, t);
  const gender = resolveCanonicalGenderFromInput(form.gender, t);
  const breeds = getBreedSuggestionsForSpecies(species || form.species);
  const breed = resolveCanonicalBreedFromInput(form.breed, breeds, t);
  return { ...form, species, gender, breed };
}

function toOptionalIsoDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function PatientFormDialog({
  mode,
  open,
  onClose,
  onSuccess,
  onCreated,
  patient,
  clinics,
}: PatientFormDialogProps) {
  const defaultClinicId = clinics.length === 1 ? clinics[0]?.id ?? '' : '';

  if (!open) {
    return null;
  }

  const formKey = `${mode}-${patient?.id ?? 'new'}-${defaultClinicId}`;

  return (
    <PatientFormDialogContent
      key={formKey}
      mode={mode}
      onClose={onClose}
      onSuccess={onSuccess}
      onCreated={onCreated}
      patient={patient}
      clinics={clinics}
      initialForm={buildInitialFormState(mode, patient, defaultClinicId)}
    />
  );
}

type PatientFormDialogContentProps = Omit<PatientFormDialogProps, 'open'> & {
  initialForm: FormState;
};

function PatientFormDialogContent({
  mode,
  onClose,
  onSuccess,
  onCreated,
  patient,
  clinics,
  initialForm,
}: PatientFormDialogContentProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() =>
    normalizePetFormState(initialForm, t),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const breedSuggestions = useMemo(
    () => getBreedSuggestionsForSpecies(form.species),
    [form.species],
  );

  const speciesOptions = useMemo(() => {
    const canonical = resolveCanonicalSpeciesFromInput(form.species, t);
    if (
      form.species &&
      !PET_SPECIES_SUGGESTIONS.some(
        (species) => species.toLowerCase() === form.species.toLowerCase(),
      ) &&
      canonical.toLowerCase() !== form.species.toLowerCase()
    ) {
      return [form.species, ...PET_SPECIES_SUGGESTIONS];
    }
    if (
      form.species &&
      canonical &&
      !PET_SPECIES_SUGGESTIONS.includes(canonical as (typeof PET_SPECIES_SUGGESTIONS)[number])
    ) {
      return [form.species, ...PET_SPECIES_SUGGESTIONS];
    }
    return [...PET_SPECIES_SUGGESTIONS];
  }, [form.species, t]);

  const breedOptions = useMemo(() => {
    if (
      form.breed &&
      !breedSuggestions.some(
        (breed) => breed.toLowerCase() === form.breed.toLowerCase(),
      )
    ) {
      return [form.breed, ...breedSuggestions];
    }
    return breedSuggestions;
  }, [breedSuggestions, form.breed]);

  const handleSpeciesChange = (nextSpecies: string) => {
    setForm((current) => {
      const breeds = getBreedSuggestionsForSpecies(nextSpecies);
      const breedStillValid =
        current.breed &&
        breeds.some((breed) => breed.toLowerCase() === current.breed.toLowerCase());
      return {
        ...current,
        species: nextSpecies,
        breed: breedStillValid ? current.breed : '',
      };
    });
  };

  const [registerPatient, registerState] = useMutation<
    { registerPatient: Patient },
    { input: RegisterPatientInput }
  >(REGISTER_PATIENT_MUTATION, {
    refetchQueries: [{ query: MY_PATIENTS_QUERY }],
  });

  const [updatePatient, updateState] = useMutation<
    { updatePatient: Patient },
    { id: string; input: UpdatePatientInput }
  >(UPDATE_PATIENT_MUTATION);

  const saving = registerState.loading || updateState.loading;
  const error = registerState.error ?? updateState.error;

  const resolvedClinicId =
    form.clinicId || (clinics.length === 1 ? clinics[0]?.id ?? '' : '');

  const maxDateOfBirth = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) {
      errors.name = t('patients.validation.nameRequired');
    }
    if (!form.species.trim()) {
      errors.species = t('patients.validation.speciesRequired');
    } else if (!isCanonicalSpecies(form.species)) {
      errors.species = t('patients.validation.speciesRequired');
    }
    if (!form.ownerFirstName.trim()) {
      errors.ownerFirstName = t('patients.validation.ownerFirstNameRequired');
    }
    if (!form.ownerLastName.trim()) {
      errors.ownerLastName = t('patients.validation.ownerLastNameRequired');
    }
    if (!form.ownerEmail.trim()) {
      errors.ownerEmail = t('patients.validation.ownerEmailRequired');
    } else if (!isValidEmail(form.ownerEmail)) {
      errors.ownerEmail = t('patients.validation.ownerEmailInvalid');
    }
    if (mode === 'add') {
      if (clinics.length > 0 && !resolvedClinicId) {
        errors.clinicId = t('patients.validation.clinicRequired');
      }
    }
    if (form.dateOfBirth && form.dateOfBirth > maxDateOfBirth) {
      errors.dateOfBirth = t('patients.validation.dateOfBirthFuture');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      if (mode === 'add') {
        const result = await registerPatient({
          variables: {
            input: {
              clinicId: resolvedClinicId,
              owner: {
                email: form.ownerEmail.trim(),
                firstName: form.ownerFirstName.trim(),
                lastName: form.ownerLastName.trim(),
              },
              name: form.name.trim(),
              species: form.species.trim(),
              breed: form.breed.trim() || undefined,
              gender: form.gender.trim() || undefined,
              dateOfBirth: toOptionalIsoDate(form.dateOfBirth),
            },
          },
        });
        const createdId = result.data?.registerPatient?.id;
        onSuccess?.();
        onClose();
        if (createdId) {
          onCreated?.(createdId);
        }
        return;
      }
      if (patient) {
        await updatePatient({
          variables: {
            id: patient.id,
            input: {
              name: form.name.trim(),
              species: form.species.trim(),
              breed: form.breed.trim() || undefined,
              gender: form.gender.trim() || undefined,
              dateOfBirth: toOptionalIsoDate(form.dateOfBirth),
              owner: {
                firstName: form.ownerFirstName.trim(),
                lastName: form.ownerLastName.trim(),
                email: form.ownerEmail.trim().toLowerCase(),
              },
            },
          },
          refetchQueries: [
            { query: MY_PATIENTS_QUERY },
            { query: PATIENT_QUERY, variables: { id: patient.id } },
          ],
        });
      }
      onSuccess?.();
      onClose();
    } catch {
      // Error state is shown via mutation error.
    }
  };

  const title =
    mode === 'add' ? t('patients.addPatient') : t('patients.editPatient');

  const requiredMark = (required: boolean) =>
    required ? <span className="patient-form-dialog__required">*</span> : null;

  return (
    <div className="patient-form-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="patient-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-form-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-form-dialog__header">
          <h2 id="patient-form-dialog-title" className="patient-form-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="patient-form-dialog__close"
            onClick={onClose}
            aria-label={t('common.close')}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form className="patient-form-dialog__form" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'add' && clinics.length > 1 ? (
            <label className="ph-field">
              <span className="ph-field__label">
                {t('patients.clinic')} {requiredMark(true)}
              </span>
              <select
                className="ph-field__input"
                value={form.clinicId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clinicId: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.clinicId)}
              >
                <option value="">{t('patients.selectClinic')}</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
              {fieldErrors.clinicId ? (
                <span className="patient-form-dialog__field-error" role="alert">
                  {fieldErrors.clinicId}
                </span>
              ) : null}
            </label>
          ) : null}

          <fieldset className="patient-form-dialog__fieldset">
            <legend>{t('patients.patientInformation')}</legend>
            <label className="ph-field">
              <span className="ph-field__label">
                {t('patients.petName')} {requiredMark(true)}
              </span>
              <input
                type="text"
                className="ph-field__input"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <span className="patient-form-dialog__field-error" role="alert">
                  {fieldErrors.name}
                </span>
              ) : null}
            </label>
            <div className="patient-form-dialog__row">
              <label className="ph-field">
                <span className="ph-field__label">
                  {t('patients.species')} {requiredMark(true)}
                </span>
                <select
                  className="ph-field__input ph-field__select"
                  value={form.species}
                  onChange={(event) => handleSpeciesChange(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.species)}
                  required
                >
                  <option value="" disabled>
                    {t('patients.placeholderSpecies')}
                  </option>
                  {speciesOptions.map((species) => (
                    <option key={species} value={species}>
                      {isCanonicalSpecies(species)
                        ? translatePetSpecies(species, t)
                        : species}
                    </option>
                  ))}
                </select>
                {fieldErrors.species ? (
                  <span className="patient-form-dialog__field-error" role="alert">
                    {fieldErrors.species}
                  </span>
                ) : null}
              </label>
              <label className="ph-field">
                <span className="ph-field__label">{t('patients.breed')}</span>
                <select
                  className="ph-field__input ph-field__select"
                  value={form.breed}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, breed: event.target.value }))
                  }
                  disabled={!form.species}
                >
                  <option value="">{t('patients.placeholderBreed')}</option>
                  {breedOptions.map((breed) => (
                    <option key={breed} value={breed}>
                      {translatePetBreed(breed, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="patient-form-dialog__row">
              <label className="ph-field">
                <span className="ph-field__label">{t('patients.gender')}</span>
                <select
                  className="ph-field__input ph-field__select"
                  value={form.gender}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, gender: event.target.value }))
                  }
                >
                  <option value="">{t('patients.placeholderGender')}</option>
                  {PET_GENDER_SUGGESTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {translatePetGender(gender, t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ph-field">
                <span className="ph-field__label">{t('patients.dateOfBirth')}</span>
                <input
                  type="date"
                  className="ph-field__input"
                  value={form.dateOfBirth}
                  max={maxDateOfBirth}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dateOfBirth: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                />
                {fieldErrors.dateOfBirth ? (
                  <span className="patient-form-dialog__field-error" role="alert">
                    {fieldErrors.dateOfBirth}
                  </span>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="patient-form-dialog__fieldset">
            <legend>{t('patients.ownerInformation')}</legend>
            <div className="patient-form-dialog__row">
              <label className="ph-field">
                <span className="ph-field__label">
                  {t('patients.ownerFirstName')} {requiredMark(true)}
                </span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.ownerFirstName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ownerFirstName: event.target.value,
                    }))
                  }
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.ownerFirstName)}
                />
                {fieldErrors.ownerFirstName ? (
                  <span className="patient-form-dialog__field-error" role="alert">
                    {fieldErrors.ownerFirstName}
                  </span>
                ) : null}
              </label>
              <label className="ph-field">
                <span className="ph-field__label">
                  {t('patients.ownerLastName')} {requiredMark(true)}
                </span>
                <input
                  type="text"
                  className="ph-field__input"
                  value={form.ownerLastName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ownerLastName: event.target.value,
                    }))
                  }
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.ownerLastName)}
                />
                {fieldErrors.ownerLastName ? (
                  <span className="patient-form-dialog__field-error" role="alert">
                    {fieldErrors.ownerLastName}
                  </span>
                ) : null}
              </label>
            </div>
            <label className="ph-field">
              <span className="ph-field__label">
                {t('patients.ownerEmail')} {requiredMark(true)}
              </span>
              <input
                type="email"
                className="ph-field__input"
                value={form.ownerEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ownerEmail: event.target.value,
                  }))
                }
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.ownerEmail)}
              />
              <span className="patient-form-dialog__field-hint">
                {t('patients.ownerEmailHint')}
              </span>
              {fieldErrors.ownerEmail ? (
                <span className="patient-form-dialog__field-error" role="alert">
                  {fieldErrors.ownerEmail}
                </span>
              ) : null}
            </label>
          </fieldset>

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
              disabled={saving}
            >
              {saving
                ? t('common.saving')
                : mode === 'add'
                  ? t('patients.addPatient')
                  : t('patients.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
