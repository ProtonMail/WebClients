import { c } from 'ttag';

import type { GroupMembership } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions } from '../../../components';
import useGroupActions from './useGroupActions';

const GroupActions = ({ membership }: { membership: GroupMembership }) => {
    const { acceptInvitation, declineInvitation, leaveMembership } = useGroupActions();

    const list = [
        membership.Status === 'active' && {
            text: c('Action').t`Leave`,
            'data-testid': 'leaveGroup',
            onClick: async () => leaveMembership(membership),
        }, // accept group
        membership.Status === 'unanswered' && {
            text: c('Action').t`Accept`,
            'data-testid': 'acceptGroup',
            onClick: async () => acceptInvitation(membership),
        }, // decline group
        membership.Status === 'unanswered' && {
            text: c('Action').t`Decline`,
            'data-testid': 'declineGroup',
            onClick: async () => declineInvitation(membership),
        },
    ].filter(isTruthy);

    return <DropdownActions list={list} size="small" />;
};

export default GroupActions;
