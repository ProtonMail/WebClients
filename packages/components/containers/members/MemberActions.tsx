import { c } from 'ttag';

import type { getSSODomainsSet } from '@proton/account/samlSSO/helper';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import { useLoading } from '@proton/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, MEMBER_PRIVATE, MEMBER_TYPE, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type {
    CachedOrganizationKey,
    EnhancedMember,
    Member,
    Organization,
    PartialMemberAddress,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { MemberUnprivatizationState } from '@proton/shared/lib/interfaces';
import { getCanGenerateMemberKeysPermissions, getShouldSetupMemberKeys } from '@proton/shared/lib/keys/memberKeys';
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
        <DropdownActions
            list={[
                onEdit && {
                    text: c('Member action').t`Edit`,
                    onClick: () => onEdit(),
                },
                onResend && {
                    text: c('Member action').t`Resend invite link`,
                    onClick: () => onResend(),
                },
                onDelete && {
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
        />
    );
};

export const getMemberPermissions = ({
    appName,
    attachSSOEnabled,
    user,
    addresses,
    member,
    organization,
    organizationKey,
    disableMemberSignIn,
    ssoDomainsSet,
}: {
    ssoDomainsSet: ReturnType<typeof getSSODomainsSet>;
    attachSSOEnabled: boolean;
    addresses: PartialMemberAddress[] | undefined;
    appName: APP_NAMES;
    user: UserModel;
    member: Member;
    organization?: Organization;
    organizationKey?: CachedOrganizationKey;
    disableMemberSignIn: boolean;
}) => {
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const isOrganizationDelinquent = organization?.State === ORGANIZATION_STATE.DELINQUENT;

    const canDelete = !member.Self;
    const canEdit = hasSetupOrganization || hasSetupOrganizationWithKeys;
    const canRevokeSessions = !member.Self && member.Type === MEMBER_TYPE.MANAGED;

    const hasUnprivatization = Boolean(member.Unprivatization);

    const canSetupMember =
        !hasUnprivatization &&
        getCanGenerateMemberKeysPermissions(user, organizationKey) &&
        getShouldSetupMemberKeys(member) &&
        addresses?.length;

    const isNonPrivate = member.Private === MEMBER_PRIVATE.READABLE;
    const hasKeysSetup = member.Keys.length > 0;

    const canLogin =
        !disableMemberSignIn &&
        appName !== APPS.PROTONVPN_SETTINGS &&
        hasSetupOrganizationWithKeys &&
        !member.Self &&
        isNonPrivate &&
        hasKeysSetup &&
        !!organizationKey?.privateKey &&
        addresses &&
        addresses?.length > 0;

    const canChangePassword =
        hasSetupOrganizationWithKeys &&
        !member.Self &&
        isNonPrivate &&
        hasKeysSetup &&
        !!organizationKey?.privateKey &&
        addresses &&
        addresses.length > 0;

    const isMemberSSO = Boolean(member.SSO);
    const canAddAddress = !isMemberSSO && addresses && addresses.length === 0;

    const canDetachSSO = attachSSOEnabled && isMemberSSO;
    const canAttachSSO =
        attachSSOEnabled &&
        Boolean(
            ssoDomainsSet.size &&
                !isMemberSSO &&
                hasKeysSetup &&
                isNonPrivate &&
                addresses?.length &&
                addresses.some((address) => {
                    const [, domain] = getEmailParts(address.Email);
                    return ssoDomainsSet.has(domain.toLowerCase());
                })
        );

    return {
        canAddAddress,
        canDelete,
        canEdit,
        canRevokeSessions,
        canSetupMember,
        canLogin,
        canChangePassword,
        isOrganizationDelinquent,
        canDetachSSO,
        canAttachSSO,
    };
};

interface Props {
    member: EnhancedMember;
    onLogin: (member: EnhancedMember) => void;
    onAddAddress: (member: EnhancedMember) => void;
    onChangePassword: (member: EnhancedMember) => void;
    onEdit: (member: EnhancedMember) => void;
    onDelete: (member: EnhancedMember) => void;
    onRevoke: (member: EnhancedMember) => Promise<void>;
    onSetup: (member: EnhancedMember) => void;
    onAttachSSO: (member: EnhancedMember) => Promise<void>;
    onDetachSSO: (member: EnhancedMember) => Promise<void>;
    permissions: ReturnType<typeof getMemberPermissions>;
    disableEdit: boolean;
}

const MemberActions = ({
    member,
    onAddAddress,
    onEdit,
    onDelete,
    onLogin,
    onSetup,
    onChangePassword,
    onRevoke,
    onAttachSSO,
    onDetachSSO,
    disableEdit,
    permissions: {
        canEdit,
        canAddAddress,
        canLogin,
        canRevokeSessions,
        canSetupMember,
        canChangePassword,
        canDelete,
        canDetachSSO,
        canAttachSSO,
        isOrganizationDelinquent,
    },
}: Props) => {
    const [loading, withLoading] = useLoading();

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            disabled: isOrganizationDelinquent || disableEdit,
            onClick: () => {
                onEdit(member);
            },
        },
        canLogin && {
            text: c('Member action').t`Sign in`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onLogin(member);
            },
        },
        canAddAddress && {
            text: c('Member action').t`Add address`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onAddAddress(member);
            },
        },
        canSetupMember && {
            text: c('Member action').t`Activate user`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onSetup(member);
            },
        },
        canChangePassword && {
            text: c('Member action').t`Change password`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                onChangePassword(member);
            },
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onRevoke(member));
            },
        },
        canAttachSSO && {
            text: c('Member action').t`Convert to SSO`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onAttachSSO(member));
            },
        },
        canDetachSSO && {
            text: c('Member action').t`Detach from SSO`,
            disabled: isOrganizationDelinquent,
            onClick: () => {
                void withLoading(onDetachSSO(member));
            },
        },
        canDelete &&
            ({
                text: canRevokeSessions ? c('Member action').t`Delete` : c('Member action').t`Remove`,
                actionType: 'delete',
                onClick: () => {
                    onDelete(member);
                },
            } as const),
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} size="small" />;
};

export default MemberActions;
