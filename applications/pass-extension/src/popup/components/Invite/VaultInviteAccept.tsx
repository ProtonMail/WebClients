import { type VFC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import { inviteAcceptIntent, inviteRejectIntent } from '@proton/pass/store';
import { inviteRespondRequest } from '@proton/pass/store/actions/requests';
import type { Invite } from '@proton/pass/types/data/invites';

import { useActionWithRequest } from '../../../shared/hooks/useActionWithRequest';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { VaultIcon } from '../Vault/VaultIcon';

export const VaultInviteAccept: VFC<Invite> = (invite) => {
    const { inviterEmail, vault } = invite;
    const { itemCount, memberCount } = vault;
    const { onInviteResponse } = useInviteContext();

    const acceptInvite = useActionWithRequest({
        action: inviteAcceptIntent,
        requestId: inviteRespondRequest(invite.token),
        onSuccess: onInviteResponse,
    });

    const rejectInvite = useActionWithRequest({
        action: inviteRejectIntent,
        requestId: inviteRespondRequest(invite.token),
        onSuccess: onInviteResponse,
    });

    const handleAcceptInvite = () =>
        acceptInvite.dispatch({
            inviteToken: invite.token,
            inviterEmail: invite.inviterEmail,
        });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: invite.token });

    const loading = acceptInvite.loading || rejectInvite.loading;

    return (
        <ModalTwo size="small" open onClose={onInviteResponse}>
            <ModalTwoHeader
                title={c('Title').t`Shared vault invitation`}
                subline={inviterEmail}
                hasClose={false}
                className="text-center"
            />
            <ModalTwoContent className="flex flex-column flex-align-items-center">
                <VaultIcon
                    color={vault.content.display.color}
                    icon={vault.content.display.icon}
                    size={32}
                    background
                    className="mb-2"
                />
                <div className="text-xl text-bold text-ellipsis">{vault.content.name}</div>
                <div className="color-weak">
                    <span>{c('Info').ngettext(msgid`${itemCount} item`, `${itemCount} items`, itemCount)}</span>
                    <span> • </span>
                    <span>
                        {c('Info').ngettext(msgid`${memberCount} member`, `${memberCount} members`, memberCount)}
                    </span>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column flex-align-items-stretch">
                <Button size="large" shape="solid" color="norm" disabled={loading} onClick={handleAcceptInvite}>{c(
                    'Action'
                ).t`Join shared vault`}</Button>
                <Button size="large" shape="solid" color="weak" disabled={loading} onClick={handleRejectInvite}>{c(
                    'Action'
                ).t`Reject invitation`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
