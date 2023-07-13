import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { MEMBER_PRIVATE, MEMBER_TYPE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { CachedOrganizationKey, Member, Organization, PartialMemberAddress } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions } from '../../components';

interface Props {
    member: Member;
    onLogin: (member: Member) => void;
    onEdit: (member: Member) => void;
    onDelete: (member: Member) => void;
    onRevoke: (member: Member) => Promise<void>;
    addresses: PartialMemberAddress[] | undefined;
    organization: Organization;
    organizationKey: CachedOrganizationKey | undefined;
}

const MemberActions = ({ member, onEdit, onDelete, onLogin, onRevoke, addresses = [], organization }: Props) => {
    const [loading, withLoading] = useLoading();
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const canDelete = !member.Self;
    const canEdit = hasSetupOrganization || hasSetupOrganizationWithKeys;
    const canRevokeSessions = hasSetupOrganizationWithKeys && !member.Self && member.Type === MEMBER_TYPE.MANAGED;
    const canLogin =
        hasSetupOrganizationWithKeys &&
        !member.Self &&
        member.Private === MEMBER_PRIVATE.READABLE &&
        member.Keys.length > 0 &&
        addresses.length > 0;

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: () => {
                onEdit(member);
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
        canLogin && {
            text: c('Member action').t`Sign in`,
            onClick: () => {
                // Add Addresses to member, missing when updated through event loop
                onLogin({ ...member, Addresses: addresses });
            },
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: () => {
                void withLoading(onRevoke(member));
            },
        },
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} size="small" />;
};

export default MemberActions;
