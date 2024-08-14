import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Tooltip } from '@proton/components/components';
import useEventManager from '@proton/components/hooks/useEventManager';
import { GROUP_MEMBERSHIP_STATUS, type GroupMembership } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import DropdownActions from '../../../components/dropdown/DropdownActions';
import useGroupActions from './useGroupActions';

const GroupActions = ({ membership, isPrivateUser }: { membership: GroupMembership; isPrivateUser: boolean }) => {
    const { acceptInvitation, declineInvitation, leaveMembership } = useGroupActions();
    const { call } = useEventManager();

    if (!isPrivateUser && membership.Status === GROUP_MEMBERSHIP_STATUS.ACTIVE) {
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
                await leaveMembership(membership);
                await call();
            },
        }, // accept group
        membership.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED && {
            text: c('Action').t`Accept`,
            'data-testid': 'acceptGroup',
            onClick: async () => {
                await acceptInvitation(membership);
                await call();
            },
        }, // decline group
        membership.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED && {
            text: c('Action').t`Decline`,
            'data-testid': 'declineGroup',
            onClick: async () => {
                await declineInvitation(membership);
                await call();
            },
        },
    ].filter(isTruthy);

    return <DropdownActions list={list} size="small" />;
};

export default GroupActions;
