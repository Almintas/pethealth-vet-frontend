import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import {
  ADMIN_VETERINARIANS_QUERY,
  APPROVE_VETERINARIAN_MUTATION,
  REJECT_VETERINARIAN_MUTATION,
} from '../graphql';
import type {
  AdminStatusFilter,
  AdminVeterinarian,
  AdminVeterinariansQueryResult,
  AdminVeterinariansQueryVariables,
} from '../types';
import '../admin.css';

const FILTERS: AdminStatusFilter[] = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

/**
 * PetHealth staff review vet registrations: check the licence number against
 * the official register, then approve or reject the account.
 */
export function AdminVeterinariansPage() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<AdminStatusFilter>('PENDING');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<
    AdminVeterinariansQueryResult,
    AdminVeterinariansQueryVariables
  >(ADMIN_VETERINARIANS_QUERY, {
    variables: { status: filter === 'ALL' ? null : filter },
    fetchPolicy: 'cache-and-network',
  });
  const [approve] = useMutation(APPROVE_VETERINARIAN_MUTATION);
  const [reject] = useMutation(REJECT_VETERINARIAN_MUTATION);

  const accounts = data?.adminVeterinarians ?? [];
  const isInitialLoading = loading && accounts.length === 0;
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const displayName = (account: AdminVeterinarian) =>
    [account.firstName, account.lastName].filter(Boolean).join(' ') ||
    t('admin.unnamed');

  const runAction = async (account: AdminVeterinarian, action: 'approve' | 'reject') => {
    if (
      action === 'reject' &&
      !window.confirm(t('admin.rejectConfirm', { name: displayName(account) }))
    ) {
      return;
    }
    setActionError(null);
    setBusyUserId(account.userId);
    try {
      const mutate = action === 'approve' ? approve : reject;
      await mutate({ variables: { userId: account.userId } });
      await refetch();
    } catch (mutationError) {
      setActionError(getAuthErrorMessage(mutationError, 'generic-save'));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="ph-page">
      <header className="ph-page-header">
        <div>
          <p className="ph-page-header__eyebrow">{t('admin.eyebrow')}</p>
          <h1 className="ph-page-header__title">{t('admin.title')}</h1>
          <p className="ph-page-header__subtitle">{t('admin.subtitle')}</p>
        </div>
      </header>

      <div className="admin-filters" role="tablist" aria-label={t('admin.filterLabel')}>
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={filter === option}
            className={[
              'admin-filters__tab',
              filter === option ? 'admin-filters__tab--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setFilter(option)}
          >
            {t(`admin.filters.${option}`)}
          </button>
        ))}
      </div>

      {actionError ? <ErrorAlert compact message={actionError} /> : null}

      {isInitialLoading ? (
        <LoadingState message={t('common.loading')} skeleton skeletonLines={4} />
      ) : null}

      {error ? (
        <ErrorAlert
          message={getAuthErrorMessage(error, 'generic-load')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isInitialLoading && !error && accounts.length === 0 ? (
        <EmptyState
          title={t(filter === 'PENDING' ? 'admin.emptyPendingTitle' : 'admin.emptyTitle')}
          description={filter === 'PENDING' ? t('admin.emptyPendingDescription') : undefined}
        />
      ) : null}

      {!isInitialLoading && !error && accounts.length > 0 ? (
        <ul className="admin-list">
          {accounts.map((account) => (
            <li key={account.userId} className="ph-card ph-card--pad admin-list__item">
              <div className="admin-list__main">
                <div className="admin-list__title-row">
                  <h2 className="admin-list__name">{displayName(account)}</h2>
                  <span
                    className={`ph-badge admin-status admin-status--${account.approvalStatus.toLowerCase()}`}
                  >
                    {t(`admin.status.${account.approvalStatus}`)}
                  </span>
                </div>
                <dl className="admin-list__facts">
                  <div>
                    <dt>{t('admin.licence')}</dt>
                    <dd className="admin-list__licence">
                      {account.licenseNumber || t('common.notProvided')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('admin.email')}</dt>
                    <dd>{account.email}</dd>
                  </div>
                  <div>
                    <dt>{t('admin.registered')}</dt>
                    <dd>{dateFormatter.format(new Date(account.registeredAt))}</dd>
                  </div>
                  {account.decidedAt ? (
                    <div>
                      <dt>{t('admin.decided')}</dt>
                      <dd>
                        {t('admin.decidedBy', {
                          who: account.decidedBy ?? t('admin.unknownAdmin'),
                          date: dateFormatter.format(new Date(account.decidedAt)),
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div className="admin-list__actions">
                {account.approvalStatus !== 'APPROVED' ? (
                  <button
                    type="button"
                    className="ph-button ph-button--primary"
                    onClick={() => void runAction(account, 'approve')}
                    disabled={busyUserId === account.userId}
                  >
                    {t('admin.approve')}
                  </button>
                ) : null}
                {account.approvalStatus !== 'REJECTED' ? (
                  <button
                    type="button"
                    className="ph-button ph-button--secondary admin-list__reject"
                    onClick={() => void runAction(account, 'reject')}
                    disabled={busyUserId === account.userId}
                  >
                    {account.approvalStatus === 'APPROVED'
                      ? t('admin.revokeApproval')
                      : t('admin.reject')}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
