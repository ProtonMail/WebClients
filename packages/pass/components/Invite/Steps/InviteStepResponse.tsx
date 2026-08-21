import { type FC, useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Progress from '@proton/components/components/progress/Progress';
import { useInviteActions } from '@proton/pass/components/Invite/InviteContext';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { groupInviteAccept, groupInviteReject, inviteAccept, inviteReject } from '@proton/pass/store/actions';
import type { ItemInvite, VaultInvite } from '@proton/pass/types';
import { InviteType, ShareType } from '@proton/pass/types';
import type { InviteAcceptSuccess } from '@proton/pass/types/data/invites.dto';

type Props = {
    acceptText: string;
    disabled?: boolean;
    invite: VaultInvite | ItemInvite;
};

export const InviteStepResponse: FC<Props> = ({ acceptText, disabled, invite }) => {
    const { token, inviterEmail, invitedAddressId, fromNewUser } = invite;
    const { setInvite, onInviteResponse } = useInviteActions();

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

    const onGroupAccept = useCallback(() => setInvite(null), []);

    const onReject = useCallback(() => onInviteResponse({ ok: false }), []);

    const onFailure = useCallback(() => onInviteResponse({ ok: false }), []);

    const acceptInvite = useRequest(inviteAccept, { onSuccess: onAccept, onFailure });
    const acceptGroupInvite = useRequest(groupInviteAccept, { onSuccess: onGroupAccept, onFailure });
    const rejectInvite = useRequest(inviteReject, { onSuccess: onReject, onFailure });
    const rejectGroupInvite = useRequest(groupInviteReject, { onSuccess: onReject, onFailure });

    const handleRejectInvite = () =>
        (invite.type === InviteType.User ? rejectInvite : rejectGroupInvite).dispatch({ inviteToken: token });
    const handleAcceptInvite = () =>
        (invite.type === InviteType.User ? acceptInvite : acceptGroupInvite).dispatch({
            inviteToken: token,
            inviterEmail,
            invitedAddressId,
        });

    const loading =
        acceptInvite.loading || acceptGroupInvite.loading || rejectInvite.loading || rejectGroupInvite.loading;

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
