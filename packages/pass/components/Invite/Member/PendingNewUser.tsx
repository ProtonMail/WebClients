import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessDTO } from '@proton/pass/lib/access/types';
import { newUserInvitePromoteIntent, newUserInviteRemoveIntent } from '@proton/pass/store/actions';
import type { NewUserPendingInvite } from '@proton/pass/types';

type Props = NewUserPendingInvite & AccessDTO;

export const PendingNewUser: FC<Props> = ({ invitedEmail, newUserInviteId, shareId, itemId, target }) => {
    const promoteInvite = useActionRequest(newUserInvitePromoteIntent);
    const removeInvite = useActionRequest(newUserInviteRemoveIntent);
    const loading = promoteInvite.loading || removeInvite.loading;

    const promote = () => promoteInvite.dispatch({ shareId, newUserInviteId, itemId, target });
    const remove = () => removeInvite.dispatch({ shareId, newUserInviteId, itemId, target });

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
                onClick={remove}
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
                onClick={promote}
            >
                {c('Action').t`Confirm access`}
            </Button>
        </div>
    );
};
