import { c } from 'ttag';

import type { getSSODomainsSet } from '@proton/account/samlSSO/helper';
import DropdownActionsIcon from '@proton/components/components/dropdown/DropdownActionsIcon';
import { useLoading } from '@proton/hooks';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_TYPE, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type {
    CachedOrganizationKey,
    EnhancedMember,
    Member,
    OrgPermissions,
    Organization,
    PartialMemberAddress,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { MEMBER_STATE, MemberUnprivatizationState } from '@proton/shared/lib/interfaces';
import { getIsMemberDisabled, getIsMemberEnabled, getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import { getCanGenerateMemberKeysPermissions, getShouldSetupMemberKeys } from '@proton/shared/lib/keys/memberKeys';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

export const MagicLinkMemberActions = ({
    state,
    onResend,
    onDelete,
    onEdit,
}: {
    state?: MemberUnprivatizationState;
    onResend?: () => void;
    onDelete?: () => Promise<void>;
    onEdit?: () => void;
}) => {
    const [loadingDelete, withLoadingDelete] = useLoading();

    return (
        <DropdownActionsIcon
            list={[
                onEdit && {
                    key: 'edit',
                    text: c('Member action').t`Edit`,
                    onClick: () => onEdit(),
                },
                onResend && {
                    key: 'resendInviteLink',
                    text: c('Member action').t`Resend invite link`,
                    onClick: () => onResend(),
                },
                onDelete && {
                    key: 'delete',
                    actionType: 'delete' as const,
                    text:
                        state === MemberUnprivatizationState.Pending
                            ? c('Member action').t`Delete and revoke invite`
                            : c('Member action').t`Delete`,
                    loading: loadingDelete,
                    onClick: () => withLoadingDelete(onDelete()),
                },
            ].filter(isTruthy)}
            size="small"
            iconElement={<IcThreeDotsVertical alt={c('Title').t`Open actions dropdown`} />}
            shape="ghost"
        />
    );
};

export const getMemberPermissions = ({
    permissions,
    appName,
    user,
    addresses,
    member,
    organization,
    organizationKey,
    disableMemberSignIn,
    backupPasswordDisabled,
    ssoDomainsSet,
    isOwner,
}: {
    permissions: OrgPermissions | null;
    appName: APP_NAMES;
    user: UserModel;
    member: Member;
    addresses: PartialMemberAddress[] | undefined;
    organization?: Organization;
    organizationKey?: CachedOrganizationKey;
    disableMemberSignIn: boolean;
    /** The organization disabled the SSO backup password, see `getSSOIntent` */
    backupPasswordDisabled: boolean;
    ssoDomainsSet: ReturnType<typeof getSSODomainsSet>;
    isOwner: boolean;
}) => {
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const isOrganizationDelinquent = organization?.State === ORGANIZATION_STATE.DELINQUENT;

    const hasUpdatePermission = !!permissions?.['account.user.update'];
    const canDelete = !member.Self && !!permissions?.['account.user.delete'];
    const canEdit = hasSetupOrganization || (hasSetupOrganizationWithKeys && hasUpdatePermission);
    const canUpdateMemberState = !member.Self && member.Type === MEMBER_TYPE.MANAGED && hasUpdatePermission;

    const hasUnprivatization = Boolean(member.Unprivatization);

    const canSetupMember =
        !hasUnprivatization &&
        getCanGenerateMemberKeysPermissions(user, organizationKey) &&
        getShouldSetupMemberKeys(member) &&
        addresses?.length &&
        hasUpdatePermission;

    const isNonPrivate = member.Private === MEMBER_PRIVATE.READABLE;
    const isPrivate = member.Private === MEMBER_PRIVATE.UNREADABLE;
    const isMemberSetup = getIsMemberSetup(member);
    const isSelf = Boolean(member.Self);
    const isEnabled = getIsMemberEnabled(member);
    const isMemberSSO = Boolean(member.SSO);
    const canRevokeSessions = !member.Self && isNonPrivate && hasUpdatePermission;

    const canLogin =
        user.isSelf &&
        isOwner &&
        !disableMemberSignIn &&
        appName !== APPS.PROTONVPN_SETTINGS &&
        isEnabled &&
        hasSetupOrganizationWithKeys &&
        !isSelf &&
        isNonPrivate &&
        isMemberSetup &&
        !!organizationKey?.privateKey &&
        addresses &&
        addresses?.length > 0;

    const canChangePassword =
        isEnabled &&
        hasSetupOrganizationWithKeys &&
        !isSelf &&
        isNonPrivate &&
        isMemberSetup &&
        !!organizationKey?.privateKey &&
        addresses &&
        addresses.length > 0 &&
        // Replace with permission check: https://protonag.atlassian.net/browse/B2B-456
        isOwner &&
        // For an SSO member this action sets their backup password. When the organization disabled
        // it there is no step in the login flow to enter it, so the password would be unusable.
        !(isMemberSSO && backupPasswordDisabled);

    const canAddAddress = !isMemberSSO && addresses && addresses.length === 0 && !!permissions?.['account.user.update'];

    const hasSSOAddress = Boolean(
        ssoDomainsSet.size &&
        addresses?.length &&
        addresses.some((address) => {
            const [, domain] = getEmailParts(address.Email);
            return ssoDomainsSet.has(domain.toLowerCase());
        })
    );
    // Self is excluded because the acting admin already holds the org key, so a retry would be a no-op.
    const canRetryRoleAssignment = Boolean(
        hasUpdatePermission && hasSetupOrganizationWithKeys && !isSelf && isMemberSetup
    );

    const canDetachSSO = isMemberSSO && isMemberSetup && !!permissions?.['account.user.update'];
    const canAttachSSO = Boolean(
        !isMemberSSO &&
        isMemberSetup &&
        // Private admins will first perform unprivatization for themselves)
        (isNonPrivate || (isPrivate && isSelf && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN)) &&
        hasSSOAddress &&
        !!permissions?.['account.user.update']
    );

    return {
        canAddAddress,
        canDelete,
        canEdit,
        canRevokeSessions,
        canUpdateMemberState,
        canSetupMember,
        canLogin,
        canChangePassword,
        isOrganizationDelinquent,
        canDetachSSO,
        canAttachSSO,
        canRetryRoleAssignment,
    };
};

interface Props {
    member: EnhancedMember;
    onLogin: (member: EnhancedMember) => Promise<void>;
    onUpdateMemberState: (member: EnhancedMember, status: MEMBER_STATE) => Promise<void>;
    onAddAddress: (member: EnhancedMember) => void;
    onChangePassword: (member: EnhancedMember) => void;
    onEdit: (member: EnhancedMember) => void;
    onDelete: (member: EnhancedMember) => void;
    onRevoke: (member: EnhancedMember) => Promise<void>;
    onSetup: (member: EnhancedMember) => void;
    onAttachSSO: (member: EnhancedMember) => Promise<void>;
    onDetachSSO: (member: EnhancedMember) => Promise<void>;
    onRetryRoleAssignment: (member: EnhancedMember) => Promise<void>;
    permissions: ReturnType<typeof getMemberPermissions>;
    disableEdit: boolean;
    hasPausedRoleAssignment: boolean;
    isRoleAssignmentRetryInFlight: boolean;
}

const MemberActions = ({
    member,
    onUpdateMemberState,
    onAddAddress,
    onEdit,
    onDelete,
    onLogin,
    onSetup,
    onChangePassword,
    onRevoke,
    onAttachSSO,
    onDetachSSO,
    onRetryRoleAssignment,
    disableEdit,
    hasPausedRoleAssignment,
    isRoleAssignmentRetryInFlight,
    permissions: {
        canEdit,
        canUpdateMemberState,
        canAddAddress,
        canLogin,
        canRevokeSessions,
        canSetupMember,
        canChangePassword,
        canDelete,
        canDetachSSO,
        canAttachSSO,
        canRetryRoleAssignment,
        isOrganizationDelinquent,
    },
}: Props) => {
    const [loading, withLoading] = useLoading();
    const isAccountSettingsUserDisableEnabled = useFlag('AccountSettingsUserDisableFE');
    const isUserDisabled = getIsMemberDisabled(member);

    const list = [
        canEdit && {
            key: 'edit',
            text: c('Member action').t`Edit`,
            disabled: isOrganizationDelinquent || disableEdit,
            onClick: () => {
                onEdit(member);
            },
        },
        hasPausedRoleAssignment &&
            canRetryRoleAssignment && {
                key: 'retryRoleAssignment',
                text: c('Member action').t`Resume role assignment`,
                disabled: isOrganizationDelinquent || isRoleAssignmentRetryInFlight,
                onClick: () => {
                    void withLoading(onRetryRoleAssignment(member));
                },
            },
        canLogin && {
            key: 'login',
            text: c('Member action').t`Sign in`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onLogin(member));
            },
        },
        canAddAddress && {
            key: 'addAddress',
            text: c('Member action').t`Add address`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onAddAddress(member);
            },
        },
        isAccountSettingsUserDisableEnabled &&
            canUpdateMemberState && {
                key: 'updateMemberState',
                text: isUserDisabled ? c('Member action').t`Enable user` : c('Member action').t`Disable user`,
                disabled: isOrganizationDelinquent,
                onClick: () => {
                    void withLoading(
                        onUpdateMemberState(
                            member,
                            isUserDisabled ? MEMBER_STATE.STATUS_ENABLED : MEMBER_STATE.STATUS_DISABLED
                        )
                    );
                },
            },
        canSetupMember && {
            key: 'setupMember',
            text: c('Member action').t`Activate user`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onSetup(member);
            },
        },
        canChangePassword && {
            key: 'changePassword',
            text: member.SSO ? c('Member action').t`Change backup password` : c('Member action').t`Change password`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onChangePassword(member);
            },
        },
        canRevokeSessions && {
            key: 'revokeSessions',
            text: c('Member action').t`Revoke sessions`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onRevoke(member));
            },
        },
        canAttachSSO && {
            key: 'attachSSO',
            text: c('Member action').t`Convert to SSO`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onAttachSSO(member));
            },
        },
        canDetachSSO && {
            key: 'detachSSO',
            text: c('Member action').t`Detach from SSO`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onDetachSSO(member));
            },
        },
        canDelete &&
            ({
                key: 'delete',
                text:
                    member.Type === MEMBER_TYPE.PROTON && !member.Self // Intended for users who are invited, e.g. in visionary or family plans
                        ? c('Member action').t`Remove`
                        : c('Member action').t`Delete`,
                actionType: 'delete',
                onClick: () => {
                    onDelete(member);
                },
            } as const),
    ].filter(isTruthy);

    if (!list.length) {
        return null;
    }

    return (
        <DropdownActionsIcon
            loading={loading}
            list={list}
            size="small"
            iconElement={<IcThreeDotsVertical alt={c('Title').t`Open actions dropdown`} />}
            shape="ghost"
        />
    );
};

export default MemberActions;
