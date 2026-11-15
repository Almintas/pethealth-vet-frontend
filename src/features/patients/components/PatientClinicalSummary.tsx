import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PROFILE_MEDICAL_RECORDS_LIMIT } from '../../medical-records/constants/medical-history-limits';
import { PATIENT_MEDICAL_RECORDS_PAGE_QUERY } from '../../medical-records/graphql';
import type { PatientMedicalRecordsPageQueryResult } from '../../medical-records/types';
import {
  formatMedicalRecordDate,
  getMedicalRecordTypeKey,
} from '../../medical-records/utils/medical-record-display';
import { PROFILE_MEDICATIONS_LIMIT } from '../../medications/constants/medications-limits';
import { PATIENT_MEDICATIONS_PAGE_QUERY } from '../../medications/graphql';
import type { PatientMedicationsPageQueryResult } from '../../medications/types';
import { PATIENT_VACCINATIONS_PAGE_QUERY } from '../../vaccinations/graphql';
import type { PatientVaccinationsPageQueryResult } from '../../vaccinations/types';
import { formatVaccinationDate } from '../../vaccinations/utils/vaccination-display';
import '../../medical-records/components/medical-history.css';

type PatientClinicalSummaryProps = {
  patientId: string;
};

export function PatientClinicalSummary({ patientId }: PatientClinicalSummaryProps) {
  const { t, i18n } = useTranslation();

  const { data: recordsData } = useQuery<PatientMedicalRecordsPageQueryResult>(
    PATIENT_MEDICAL_RECORDS_PAGE_QUERY,
    {
      variables: {
        patientId,
        query: { page: 1, limit: PROFILE_MEDICAL_RECORDS_LIMIT },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: medicationsData } = useQuery<PatientMedicationsPageQueryResult>(
    PATIENT_MEDICATIONS_PAGE_QUERY,
    {
      variables: {
        patientId,
        query: { page: 1, limit: PROFILE_MEDICATIONS_LIMIT },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: vaccinationsData } = useQuery<PatientVaccinationsPageQueryResult>(
    PATIENT_VACCINATIONS_PAGE_QUERY,
    {
      variables: {
        patientId,
        query: { page: 1, limit: 1 },
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const medicalSummary = useMemo(() => {
    const pageResult = recordsData?.patientMedicalRecordsPage;
    const records = pageResult?.items ?? [];
    const total = pageResult?.total ?? 0;
    const latest = records[0];
    if (!latest) {
      return {
        lastVisitLabel: t('medicalRecords.noVisitsYet'),
        lastRecordLabel: t('medicalRecords.noRecordsYet'),
        total: 0,
      };
    }
    const typeKey = getMedicalRecordTypeKey(latest);
    const typeLabel = t(`enums.medicalRecordType.${typeKey}`);
    const lastRecordLabel = latest.title.trim()
      ? `${typeLabel} — ${latest.title}`
      : typeLabel;
    return {
      lastVisitLabel: formatMedicalRecordDate(latest.date, i18n.language),
      lastRecordLabel,
      total,
    };
  }, [recordsData?.patientMedicalRecordsPage, i18n.language, t]);

  const medicationSummary = useMemo(() => {
    const pageResult = medicationsData?.patientMedicationsPage;
    const activeTotal = pageResult?.activeTotal ?? 0;
    const latest =
      pageResult?.items.find((item) => item.isActive) ?? pageResult?.items[0];
    return {
      activeLabel:
        activeTotal > 0
          ? String(activeTotal)
          : t('medications.noneActive'),
      latestLabel: latest?.name ?? t('medications.noMedicationsYetShort'),
    };
  }, [medicationsData?.patientMedicationsPage, t]);

  const vaccinationSummary = useMemo(() => {
    const pageResult = vaccinationsData?.patientVaccinationsPage;
    const total = pageResult?.total ?? 0;
    const nextDueVaccineName = pageResult?.nextDueVaccineName;
    const nextDueAt = pageResult?.nextDueAt;

    if (total === 0) {
      return {
        label: t('vaccinations.clinicalSummaryLabel'),
        value: t('vaccinations.noRecordsYet'),
      };
    }

    if (nextDueVaccineName && nextDueAt) {
      return {
        label: t('vaccinations.nextVaccination'),
        value: t('vaccinations.nextVaccinationSummary', {
          vaccine: nextDueVaccineName,
          date: formatVaccinationDate(nextDueAt, i18n.language),
        }),
      };
    }

    return {
      label: t('vaccinations.clinicalSummaryLabel'),
      value: t('vaccinations.upToDate'),
    };
  }, [vaccinationsData?.patientVaccinationsPage, i18n.language, t]);

  return (
    <section className="patient-profile__block" aria-labelledby="clinical-summary-heading">
      <h2 id="clinical-summary-heading" className="patient-profile__block-title">
        {t('medicalRecords.clinicalSummary')}
      </h2>
      <dl className="medical-history__summary">
        <div>
          <dt>{t('medicalRecords.lastVisit')}</dt>
          <dd>{medicalSummary.lastVisitLabel}</dd>
        </div>
        <div>
          <dt>{t('medicalRecords.lastRecord')}</dt>
          <dd>{medicalSummary.lastRecordLabel}</dd>
        </div>
        <div>
          <dt>{t('medicalRecords.totalRecords')}</dt>
          <dd>{medicalSummary.total}</dd>
        </div>
        <div>
          <dt>{t('medications.activeMedications')}</dt>
          <dd>{medicationSummary.activeLabel}</dd>
        </div>
        <div>
          <dt>{t('medications.latestMedication')}</dt>
          <dd>{medicationSummary.latestLabel}</dd>
        </div>
        <div>
          <dt>{vaccinationSummary.label}</dt>
          <dd>{vaccinationSummary.value}</dd>
        </div>
      </dl>
    </section>
  );
}
