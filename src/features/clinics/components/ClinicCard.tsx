import { useTranslation } from 'react-i18next';
import type { ClinicMembership } from '../types';

type ClinicCardProps = {
  membership: ClinicMembership;
};

export function ClinicCard({ membership }: ClinicCardProps) {
  const { t } = useTranslation();
  const clinic = membership.clinic;

  return (
    <article className="ph-card ph-card--pad clinic-card">
      <div className="clinic-card__header">
        <h3 className="clinic-card__title">{clinic.name}</h3>
        {membership.status ? (
          <span className="ph-badge ph-badge--success">
            {t(`clinics.membershipStatus.${membership.status}`, {
              defaultValue: membership.status,
            })}
          </span>
        ) : null}
      </div>
      <dl className="clinic-card__details">
        <div>
          <dt>{t('clinics.email')}</dt>
          <dd>{clinic.email?.trim() || t('common.notProvided')}</dd>
        </div>
        <div>
          <dt>{t('clinics.phone')}</dt>
          <dd>{clinic.phone?.trim() || t('common.notProvided')}</dd>
        </div>
        <div>
          <dt>{t('clinics.address')}</dt>
          <dd>{clinic.address?.trim() || t('common.notProvided')}</dd>
        </div>
      </dl>
    </article>
  );
}
