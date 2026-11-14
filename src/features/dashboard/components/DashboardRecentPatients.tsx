import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState } from '../../../components/feedback/EmptyState';
import type { Patient } from '../../patients/types';
import {
  getOwnerFullName,
  getSpeciesBreedLine,
} from '../../patients/utils/patient-display';

type DashboardRecentPatientsProps = {
  patients: Patient[];
};

export function DashboardRecentPatients({ patients }: DashboardRecentPatientsProps) {
  const { t } = useTranslation();

  if (patients.length === 0) {
    return (
      <EmptyState
        section
        title={t('dashboard.recentPatientsEmptyTitle')}
        description={t('dashboard.recentPatientsEmptyDescription')}
      />
    );
  }

  return (
    <ul className="ph-card dashboard-recent-patients">
      {patients.map((patient) => (
        <li key={patient.id}>
          <Link className="dashboard-recent-patients__row" to={`/patients/${patient.id}`}>
            <span className="dashboard-recent-patients__main">
              <span className="dashboard-recent-patients__name">{patient.name}</span>
              <span className="dashboard-recent-patients__meta">
                {getSpeciesBreedLine(patient, t)}
              </span>
            </span>
            <span className="dashboard-recent-patients__owner">
              {getOwnerFullName(patient)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
