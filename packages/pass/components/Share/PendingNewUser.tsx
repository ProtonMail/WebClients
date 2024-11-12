import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { newUserInvitePromoteIntent, newUserInviteRemoveIntent } from '@proton/pass/store/actions';
import type { NewUserPendingInvite, SelectedShare } from '@proton/pass/types';
import type { NewUserInvitePromoteIntent } from '@proton/pass/types/data/invites.dto';

type Props = NewUserPendingInvite & SelectedShare;

export const PendingNewUser: FC<Props> = ({ invitedEmail, newUserInviteId, shareId }) => {
    const promoteInvite = useActionRequest(newUserInvitePromoteIntent);
    const removeInvite = useActionRequest(newUserInviteRemoveIntent);
    const loading = promoteInvite.loading || removeInvite.loading;

    const handlePromoteInvite = ({ shareId, newUserInviteId }: NewUserInvitePromoteIntent) =>
        promoteInvite.dispatch({ shareId, newUserInviteId });

    const handleRemoveInvite = ({ shareId, newUserInviteId }: NewUserInvitePromoteIntent) =>
        removeInvite.dispatch({ shareId, newUserInviteId });

    return (
        <div className="flex items-center gap-2">
            <span className="flex-1 text-ellipsis" title={invitedEmail}>
                {invitedEmail}
            </span>
            <Button
                pill
                shape="outline"
                color="danger"
                size="small"
                className="text-sm shrink-0"
                loading={removeInvite.loading}
                disabled={loading}
                onClick={() => handleRemoveInvite({ shareId, newUserInviteId })}
            >
                {c('Action').t`Remove access`}
            </Button>
            <Button
                pill
                shape="solid"
                color="weak"
                size="small"
                className="text-sm shrink-0"
                loading={promoteInvite.loading}
                disabled={loading}
                onClick={() => handlePromoteInvite({ shareId, newUserInviteId })}
            >
                {c('Action').t`Confirm access`}
            </Button>
        </div>
    );
};
