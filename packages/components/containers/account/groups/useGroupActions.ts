import { c } from 'ttag';

import { acceptGroupInvitation } from '@proton/account/groups/acceptGroupInvitation';
import { declineGroupInvitation } from '@proton/account/groups/declineGroupInvitation';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import type { GroupMembership } from '@proton/shared/lib/interfaces';

const useGroupActions = () => {
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const acceptInvitation = async (membership: GroupMembership) => {
        try {
            await dispatch(acceptGroupInvitation({ membership }));
            createNotification({ text: c('group_invitation: Success').t`Group invitation accepted` });
        } catch (error) {
            handleError(error);
        }
    };

    const declineInvitation = async (membership: GroupMembership) => {
        try {
            await dispatch(declineGroupInvitation({ membership }));
            createNotification({ text: c('group_invitation: Success').t`Group invitation declined` });
        } catch (error) {
            handleError(error);
        }
    };

    const leaveMembership = async (membership: GroupMembership) => {
        try {
            await dispatch(declineGroupInvitation({ membership }));
            createNotification({ text: c('group_invitation: Success').t`Left group` });
        } catch (error) {
            handleError(error);
        }
    };

    return {
        acceptInvitation,
        declineInvitation,
        leaveMembership,
    };
};

export default useGroupActions;
