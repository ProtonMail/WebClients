import { type FC, useCallback } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Progress } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { inviteAccept, inviteReject } from '@proton/pass/store/actions';
import type { ItemInvite, VaultInvite } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import type { InviteAcceptSuccess } from '@proton/pass/types/data/invites.dto';

type Props = {
    acceptText: string;
    disabled?: boolean;
    invite: VaultInvite | ItemInvite;
};

export const InviteStepResponse: FC<Props> = ({ acceptText, disabled, invite }) => {
    const { token, inviterEmail, invitedAddressId, fromNewUser } = invite;
    const { onInviteResponse } = useInviteActions();

    const onAccept = useCallback(({ share, items }: InviteAcceptSuccess) => {
        const { shareId } = share;

        switch (share.targetType) {
            case ShareType.Vault:
                return onInviteResponse({ ok: true, shareId });
            case ShareType.Item:
                const [{ itemId }] = items;
                return onInviteResponse({ ok: true, shareId, itemId });
        }
    }, []);

    const onReject = useCallback(() => onInviteResponse({ ok: false }), []);

    const acceptInvite = useRequest(inviteAccept, { onSuccess: onAccept });
    const rejectInvite = useRequest(inviteReject, { onSuccess: onReject });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: token });
    const handleAcceptInvite = () => acceptInvite.dispatch({ inviteToken: token, inviterEmail, invitedAddressId });

    const loading = acceptInvite.loading || rejectInvite.loading;

    /** item invites do not have a `vault` property */
    const itemCount = invite.vault?.itemCount ?? 1;

    return (
        <>
            <Button
                pill
                size="large"
                shape="solid"
                color="norm"
                disabled={loading || disabled}
                loading={acceptInvite.loading}
                onClick={handleAcceptInvite}
            >
                {acceptText}
            </Button>

            <Button
                pill
                size="large"
                shape="solid"
                color="weak"
                disabled={loading}
                loading={rejectInvite.loading}
                onClick={handleRejectInvite}
            >
                {fromNewUser ? c('Action').t`Reject` : c('Action').t`Reject invitation`}
            </Button>

            {acceptInvite.loading && (
                <div className="ui-purple flex gap-x-2 items-center">
                    <Progress
                        value={(itemCount ?? 1) > 0 ? Math.round(100 * (acceptInvite.progress / itemCount)) : 0}
                        className="flex-1 progress-bar--norm"
                    />

                    <small className="block">
                        {acceptInvite.progress} / {itemCount}
                    </small>
                    <CircleLoader size="small" />
                </div>
            )}
        </>
    );
};
