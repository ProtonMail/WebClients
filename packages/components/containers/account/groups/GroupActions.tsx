import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useLoading from '@proton/hooks/useLoading';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { GROUP_MEMBERSHIP_STATUS, GROUP_MEMBER_PERMISSIONS, type GroupMembership } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import useGroupActions from './useGroupActions';

const GroupActions = ({ membership }: { membership: GroupMembership }) => {
    const { acceptInvitation, declineInvitation, leaveMembership } = useGroupActions();
    const [loading, withLoading] = useLoading();

    const canLeave = hasBit(membership.Permissions, GROUP_MEMBER_PERMISSIONS.LEAVE);
    if (!canLeave && membership.Status === GROUP_MEMBERSHIP_STATUS.ACTIVE) {
        return (
            <Tooltip title={c('Info').t`You do not have permission to perform this action`}>
                <div className="inline-block">
                    <Button size="small" disabled={true}>
                        {c('Action').t`Leave`}
                    </Button>
                </div>
            </Tooltip>
        );
    }

    const list = [
        membership.Status === GROUP_MEMBERSHIP_STATUS.ACTIVE && {
            text: c('Action').t`Leave`,
            'data-testid': 'leaveGroup',
            onClick: async () => {
                await withLoading(leaveMembership(membership));
            },
        }, // accept group
        membership.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED && {
            text: c('Action').t`Accept`,
            'data-testid': 'acceptGroup',
            onClick: async () => {
                await withLoading(acceptInvitation(membership));
            },
        }, // decline group
        membership.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED && {
            text: c('Action').t`Decline`,
            'data-testid': 'declineGroup',
            onClick: async () => {
                await withLoading(declineInvitation(membership));
            },
        },
    ].filter(isTruthy);

    return <DropdownActions list={list} size="small" loading={loading} />;
};

export default GroupActions;
