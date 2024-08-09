import { c } from 'ttag';

import useEventManager from '@proton/components/hooks/useEventManager';
import type { GroupMembership } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import DropdownActions from '../../../components/dropdown/DropdownActions';
import useGroupActions from './useGroupActions';

const GroupActions = ({ membership }: { membership: GroupMembership }) => {
    const { acceptInvitation, declineInvitation, leaveMembership } = useGroupActions();
    const { call } = useEventManager();

    const list = [
        membership.Status === 'active' && {
            text: c('Action').t`Leave`,
            'data-testid': 'leaveGroup',
            onClick: async () => {
                await leaveMembership(membership);
                await call();
            },
        }, // accept group
        membership.Status === 'unanswered' && {
            text: c('Action').t`Accept`,
            'data-testid': 'acceptGroup',
            onClick: async () => {
                await acceptInvitation(membership);
                await call();
            },
        }, // decline group
        membership.Status === 'unanswered' && {
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
