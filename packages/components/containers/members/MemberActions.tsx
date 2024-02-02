import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { APPS, MEMBER_PRIVATE, MEMBER_TYPE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import {
    CachedOrganizationKey,
    EnhancedMember,
    Organization,
    PartialMemberAddress,
} from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useConfig } from '../..';
import { DropdownActions } from '../../components';

interface Props {
    member: EnhancedMember;
    onLogin: (member: EnhancedMember) => void;
    onChangePassword: (member: EnhancedMember) => void;
    onEdit: (member: EnhancedMember) => void;
    onDelete: (member: EnhancedMember) => void;
    onRevoke: (member: EnhancedMember) => Promise<void>;
    addresses: PartialMemberAddress[] | undefined;
    organization?: Organization;
    disableMemberSignIn?: boolean;
    organizationKey?: CachedOrganizationKey;
}

const MemberActions = ({
    member,
    organizationKey,
    onEdit,
    onDelete,
    onLogin,
    onChangePassword,
    onRevoke,
    addresses = [],
    organization,
    disableMemberSignIn,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const canDelete = !member.Self;
    const canEdit = hasSetupOrganization || hasSetupOrganizationWithKeys;
    const canRevokeSessions = !member.Self && member.Type === MEMBER_TYPE.MANAGED;

    const canLogin =
        !disableMemberSignIn &&
        APP_NAME !== APPS.PROTONVPN_SETTINGS &&
        hasSetupOrganizationWithKeys &&
        !member.Self &&
        member.Private === MEMBER_PRIVATE.READABLE &&
        member.Keys.length > 0 &&
        !!organizationKey?.privateKey &&
        addresses.length > 0;

    const canChangePassword =
        hasSetupOrganizationWithKeys &&
        !member.Self &&
        member.Private === MEMBER_PRIVATE.READABLE &&
        member.Keys.length > 0 &&
        !!organizationKey?.privateKey &&
        addresses.length > 0;

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: () => {
                onEdit(member);
            },
        },
        canLogin && {
            text: c('Member action').t`Sign in`,
            onClick: () => {
                onLogin(member);
            },
        },
        canChangePassword && {
            text: c('Member action').t`Change password`,
            onClick: () => {
                onChangePassword(member);
            },
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: () => {
                void withLoading(onRevoke(member));
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
