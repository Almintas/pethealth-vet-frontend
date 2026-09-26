import { useTranslation } from 'react-i18next';
import { LoadingState } from '../components/feedback/LoadingState';

export function RouteLoading() {
  const { t } = useTranslation();
  return (
    <div className="route-loading">
      <LoadingState message={t('common.loading')} />
    </div>
  );
}
