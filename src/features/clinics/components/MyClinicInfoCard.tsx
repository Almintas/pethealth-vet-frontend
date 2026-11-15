import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../auth/types';
import type { Clinic } from '../types';

type MyClinicInfoCardProps = {
  clinic: Clinic;
  user: AuthUser | null;
};

function hasClinicDetail(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function formatRole(role: string, t: (key: string) => string): string {
  const key = `clinics.roles.${role}`;
  const translated = t(key);
  return translated === key ? role : translated;
}

export function MyClinicInfoCard({ clinic, user }: MyClinicInfoCardProps) {
  const { t } = useTranslation();
  const showEmail = hasClinicDetail(clinic.email);
  const showPhone = hasClinicDetail(clinic.phone);
  const showAddress = hasClinicDetail(clinic.address);

  return (
    <article className="ph-card ph-card--pad my-clinic-card">
      <dl className="my-clinic-card__details">
        <div>
          <dt>{t('clinics.name')}</dt>
          <dd>{clinic.name}</dd>
        </div>
        {showEmail ? (
          <div>
            <dt>{t('clinics.email')}</dt>
            <dd>{clinic.email?.trim()}</dd>
          </div>
        ) : null}
        {showPhone ? (
          <div>
            <dt>{t('clinics.phone')}</dt>
            <dd>{clinic.phone?.trim()}</dd>
          </div>
        ) : null}
        {showAddress ? (
          <div>
            <dt>{t('clinics.address')}</dt>
            <dd>{clinic.address?.trim()}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t('clinics.yourRole')}</dt>
          <dd>
            {clinic.myRole
              ? t(`clinics.memberRoles.${clinic.myRole}`)
              : user?.role
                ? formatRole(user.role, t)
                : t('common.notProvided')}
          </dd>
        </div>
        <div>
          <dt>{t('clinics.membership')}</dt>
          <dd>
            <span className="ph-badge ph-badge--success">
              {t('clinics.membershipActive')}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
