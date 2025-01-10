import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms/index';
import { Progress } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { inviteAcceptIntent, inviteRejectIntent } from '@proton/pass/store/actions';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemInvite, VaultInvite } from '@proton/pass/types';

type Props = {
    acceptText: string;
    limitText: string;
    invite: VaultInvite | ItemInvite;
};

export const InviteStepResponse: FC<Props> = ({ acceptText, invite, limitText }) => {
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const { token, inviterEmail, invitedAddressId, fromNewUser } = invite;
    const { onInviteResponse } = useInviteActions();

    const acceptInvite = useActionRequest(inviteAcceptIntent, { onSuccess: onInviteResponse });
    const rejectInvite = useActionRequest(inviteRejectIntent, { onSuccess: onInviteResponse });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: token });
    const handleAcceptInvite = () => acceptInvite.dispatch({ inviteToken: token, inviterEmail, invitedAddressId });

    const loading = acceptInvite.loading || rejectInvite.loading;

    /** item invites do not have a `vault` property */
    const itemCount = invite.vault?.itemCount ?? 1;

    return (
        <>
            {vaultLimitReached && (
                <Card className="mb-2 text-sm" type="primary">
                    {limitText}
                </Card>
            )}
            <Button
                pill
                size="large"
                shape="solid"
                color="norm"
                disabled={loading || vaultLimitReached}
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
