import { useMutation, useQuery } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { getAuthErrorMessage } from '../../auth/utils/get-auth-error-message';
import type { Clinic, ClinicMemberRole } from '../../clinics/types';
import {
  CLINIC_INVITATIONS_QUERY,
  CLINIC_MEMBERS_QUERY,
  INVITE_CLINIC_MEMBER_MUTATION,
  REMOVE_CLINIC_MEMBER_MUTATION,
  REVOKE_CLINIC_INVITATION_MUTATION,
} from '../graphql';
import {
  CLINIC_MEMBER_ROLES,
  type ClinicInvitation,
  type ClinicMember,
  type InviteClinicMemberResult,
} from '../types';
import './clinic-team.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClinicTeamSectionProps = {
  clinic: Clinic;
};

/**
 * The clinic's team. Everyone sees who works here; clinic administrators can
 * invite people by email, cancel invitations and remove members.
 */
export function ClinicTeamSection({ clinic }: ClinicTeamSectionProps) {
  const { t, i18n } = useTranslation();
  const isAdmin = clinic.myRole === 'ADMIN';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ClinicMemberRole>('VETERINARIAN');
  const [formError, setFormError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{
    email: string;
    inviteUrl: string;
    emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const variables = { clinicId: clinic.id };
  const membersQuery = useQuery<{ clinicMembers: ClinicMember[] }>(CLINIC_MEMBERS_QUERY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
  const invitationsQuery = useQuery<{ clinicInvitations: ClinicInvitation[] }>(
    CLINIC_INVITATIONS_QUERY,
    { variables, skip: !isAdmin, fetchPolicy: 'cache-and-network' },
  );
  const refetchTeam = [
    { query: CLINIC_MEMBERS_QUERY, variables },
    ...(isAdmin ? [{ query: CLINIC_INVITATIONS_QUERY, variables }] : []),
  ];
  const [invite, inviteState] = useMutation<InviteClinicMemberResult>(
    INVITE_CLINIC_MEMBER_MUTATION,
    { refetchQueries: refetchTeam },
  );
  const [revokeInvitation] = useMutation(REVOKE_CLINIC_INVITATION_MUTATION, {
    refetchQueries: refetchTeam,
  });
  const [removeMember] = useMutation(REMOVE_CLINIC_MEMBER_MUTATION, {
    refetchQueries: refetchTeam,
  });

  const members = membersQuery.data?.clinicMembers ?? [];
  const invitations = invitationsQuery.data?.clinicInvitations ?? [];
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFormError(t('validation.emailInvalid'));
      return;
    }
    setFormError(null);
    setCopied(false);
    try {
      const result = await invite({
        variables: { input: { clinicId: clinic.id, email: normalizedEmail, role } },
      });
      const payload = result.data?.inviteClinicMember;
      if (payload) {
        setLastInvite({
          email: normalizedEmail,
          inviteUrl: payload.inviteUrl,
          emailSent: payload.emailSent,
        });
      }
      setEmail('');
    } catch (inviteError) {
      setFormError(getAuthErrorMessage(inviteError, 'save-clinic'));
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(getAuthErrorMessage(error, 'save-clinic'));
    }
  };

  const handleRemove = (member: ClinicMember) => {
    const name = `${member.firstName} ${member.lastName}`.trim();
    if (!window.confirm(t('clinicTeam.removeConfirm', { name, clinic: clinic.name }))) {
      return;
    }
    void runAction(() =>
      removeMember({ variables: { clinicId: clinic.id, membershipId: member.membershipId } }),
    );
  };

  return (
    <section className="ph-card ph-card--pad clinic-team" aria-labelledby={`team-${clinic.id}`}>
      <header className="clinic-team__header">
        <h2 id={`team-${clinic.id}`} className="clinic-team__title">
          {t('clinicTeam.title')}
        </h2>
        <p className="clinic-team__intro">
          {isAdmin ? t('clinicTeam.introAdmin') : t('clinicTeam.introMember')}
        </p>
      </header>

      {actionError ? <ErrorAlert compact message={actionError} /> : null}

      {membersQuery.loading && members.length === 0 ? (
        <LoadingState message={t('common.loading')} skeleton skeletonLines={2} />
      ) : null}
      {membersQuery.error ? (
        <ErrorAlert
          compact
          message={getAuthErrorMessage(membersQuery.error, 'load-clinics')}
          onRetry={() => void membersQuery.refetch()}
        />
      ) : null}

      {members.length > 0 ? (
        <ul className="clinic-team__list">
          {members.map((member) => (
            <li key={member.membershipId} className="clinic-team__row">
              <div className="clinic-team__person">
                <span className="clinic-team__name">
                  {`${member.firstName} ${member.lastName}`.trim()}
                  {member.isMe ? (
                    <span className="clinic-team__you"> · {t('clinicTeam.you')}</span>
                  ) : null}
                </span>
                <span className="clinic-team__meta">
                  {[member.email, t(`clinics.memberRoles.${member.role}`)]
                    .filter(Boolean)
                    .join(' · ')}
                  {member.approvalStatus !== 'APPROVED'
                    ? ` · ${t('clinicTeam.awaitingApproval')}`
                    : ''}
                </span>
              </div>
              {isAdmin && !member.isMe ? (
                <button
                  type="button"
                  className="ph-button ph-button--secondary clinic-team__danger"
                  onClick={() => handleRemove(member)}
                >
                  {t('clinicTeam.remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {isAdmin ? (
        <>
          <h3 className="clinic-team__subtitle">{t('clinicTeam.inviteTitle')}</h3>
          <form className="clinic-team__invite" onSubmit={(event) => void handleInvite(event)} noValidate>
            <label className="ph-field clinic-team__email">
              <span className="ph-field__label">{t('clinics.email')}</span>
              <input
                className="ph-field__input"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(formError)}
              />
            </label>
            <label className="ph-field">
              <span className="ph-field__label">{t('clinicTeam.role')}</span>
              <select
                className="ph-field__input ph-field__select"
                value={role}
                onChange={(event) => setRole(event.target.value as ClinicMemberRole)}
              >
                {CLINIC_MEMBER_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {t(`clinics.memberRoles.${option}`)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="ph-button ph-button--primary clinic-team__invite-button"
              disabled={inviteState.loading}
            >
              {inviteState.loading ? t('clinicTeam.inviting') : t('clinicTeam.invite')}
            </button>
          </form>
          <p className="clinic-team__hint">{t(`clinicTeam.roleHints.${role}`)}</p>
          {formError ? (
            <p className="clinic-team__error" role="alert">
              {formError}
            </p>
          ) : null}

          {lastInvite ? (
            <div className="clinic-team__notice" role="status">
              <p>
                {lastInvite.emailSent
                  ? t('clinicTeam.inviteSent', { email: lastInvite.email })
                  : t('clinicTeam.inviteNotEmailed', { email: lastInvite.email })}
              </p>
              <div className="clinic-team__link-row">
                <input
                  className="ph-field__input clinic-team__link"
                  readOnly
                  value={lastInvite.inviteUrl}
                  aria-label={t('clinicTeam.inviteLink')}
                  onFocus={(event) => event.target.select()}
                />
                <button
                  type="button"
                  className="ph-button ph-button--secondary"
                  onClick={() => void copyLink(lastInvite.inviteUrl)}
                >
                  {copied ? t('clinicTeam.copied') : t('clinicTeam.copyLink')}
                </button>
              </div>
            </div>
          ) : null}

          {invitations.length > 0 ? (
            <>
              <h3 className="clinic-team__subtitle">{t('clinicTeam.pendingTitle')}</h3>
              <ul className="clinic-team__list">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="clinic-team__row">
                    <div className="clinic-team__person">
                      <span className="clinic-team__name">{invitation.email}</span>
                      <span className="clinic-team__meta">
                        {t(`clinics.memberRoles.${invitation.role}`)} ·{' '}
                        {t('clinicTeam.expires', {
                          date: dateFormatter.format(new Date(invitation.expiresAt)),
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ph-button ph-button--secondary"
                      onClick={() =>
                        void runAction(() =>
                          revokeInvitation({ variables: { invitationId: invitation.id } }),
                        )
                      }
                    >
                      {t('clinicTeam.cancelInvite')}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
