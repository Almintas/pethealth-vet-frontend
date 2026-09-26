import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

type QuickAction = {
  id: string;
  labelKey:
    | 'dashboard.quickActions.findPatient'
    | 'dashboard.quickActions.viewAppointments'
    | 'dashboard.quickActions.addMedicalRecord';
  descriptionKey:
    | 'dashboard.quickActions.findPatientDescription'
    | 'dashboard.quickActions.viewAppointmentsDescription'
    | 'dashboard.quickActions.addMedicalRecordDescription';
  to?: string;
  comingSoon?: boolean;
};

const quickActions: QuickAction[] = [
  {
    id: 'find-patient',
    labelKey: 'dashboard.quickActions.findPatient',
    descriptionKey: 'dashboard.quickActions.findPatientDescription',
    to: '/patients',
  },
  {
    id: 'view-appointments',
    labelKey: 'dashboard.quickActions.viewAppointments',
    descriptionKey: 'dashboard.quickActions.viewAppointmentsDescription',
    to: '/appointments',
  },
  {
    id: 'add-medical-record',
    labelKey: 'dashboard.quickActions.addMedicalRecord',
    descriptionKey: 'dashboard.quickActions.addMedicalRecordDescription',
    comingSoon: true,
  },
];

export function DashboardQuickActions() {
  const { t } = useTranslation();

  return (
    <div className="dashboard-quick-actions">
      {quickActions.map((action) => {
        const content = (
          <>
            <span className="dashboard-quick-actions__label">{t(action.labelKey)}</span>
            <span className="dashboard-quick-actions__description">
              {t(action.descriptionKey)}
            </span>
            {action.comingSoon ? (
              <span className="dashboard-quick-actions__badge">{t('common.comingSoon')}</span>
            ) : null}
          </>
        );

        if (action.to && !action.comingSoon) {
          return (
            <Link
              key={action.id}
              className="ph-card ph-card--pad dashboard-quick-actions__card dashboard-quick-actions__card--link"
              to={action.to}
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={action.id}
            className="ph-card ph-card--pad dashboard-quick-actions__card dashboard-quick-actions__card--disabled"
            aria-disabled="true"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
