import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { inviteAcceptIntent, inviteRejectIntent } from '@proton/pass/store/actions';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemInvite } from '@proton/pass/types/data/invites';

export const ItemInviteRespond: FC<ItemInvite> = (invite) => {
    const { inviterEmail, invitedAddressId, token, fromNewUser } = invite;
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const { onInviteResponse } = useInviteActions();

    const acceptInvite = useActionRequest(inviteAcceptIntent, { onSuccess: onInviteResponse });
    const rejectInvite = useActionRequest(inviteRejectIntent, { onSuccess: onInviteResponse });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: invite.token });
    const handleAcceptInvite = () => acceptInvite.dispatch({ inviteToken: token, inviterEmail, invitedAddressId });

    const loading = acceptInvite.loading || rejectInvite.loading;

    return (
        <PassModal size="small" open onClose={onInviteResponse} enableCloseWhenClickOutside>
            <ModalTwoHeader
                className="text-center text-break-all"
                hasClose={false}
                title={c('Info').t`Shared item invitation`}
            />

            <ModalTwoContent className="text-center">
                {c('Info').t`${inviterEmail} wants to share an item with you.`}
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {vaultLimitReached && (
                    <Card className="mb-2 text-sm" type="primary">
                        {c('Warning').t`You have reached the limit of vaults you can have in your plan.`}
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
                    {fromNewUser ? c('Action').t`Continue` : c('Action').t`Accept and view the item`}
                </Button>

                <Button
                    pill
                    size="large"
                    shape="solid"
                    color="weak"
                    disabled={loading || !userVerified}
                    loading={rejectInvite.loading}
                    onClick={handleRejectInvite}
                >
                    {fromNewUser ? c('Action').t`Reject` : c('Action').t`Reject invitation`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
