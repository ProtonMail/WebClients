import { c } from 'ttag';

import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { CachedOrganizationKey, Member, Organization, PartialMemberAddress } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions } from '../../components';
import { useLoading } from '../../hooks';

interface Props {
    member: Member;
    onLogin: (member: Member) => void;
    onEdit: (member: Member) => void;
    onDelete: (member: Member) => Promise<void>;
    onRevoke: (member: Member) => Promise<void>;
    addresses: PartialMemberAddress[] | undefined;
    organization: Organization;
    organizationKey: CachedOrganizationKey | undefined;
}

const MemberActions = ({ member, onEdit, onDelete, onLogin, onRevoke, addresses = [], organization }: Props) => {
    const [loading, withLoading] = useLoading();

    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevokeSessions = !member.Self;

    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && addresses.length;

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: () => {
                onEdit(member);
            },
        },
        canDelete &&
            ({
                text: c('Member action').t`Delete`,
                actionType: 'delete',
                onClick: () => {
                    withLoading(onDelete(member));
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
                withLoading(onRevoke(member));
            },
        },
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} size="small" />;
};

export default MemberActions;
