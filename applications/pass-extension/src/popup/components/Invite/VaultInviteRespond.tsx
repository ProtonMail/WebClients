import { type VFC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Progress } from '@proton/components/components';
import { inviteAcceptIntent, inviteRejectIntent } from '@proton/pass/store';
import { inviteAcceptRequest, inviteRejectRequest } from '@proton/pass/store/actions/requests';
import type { Invite } from '@proton/pass/types/data/invites';

import { useActionWithRequest } from '../../../shared/hooks/useActionWithRequest';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { VaultIcon } from '../Vault/VaultIcon';

export const VaultInviteRespond: VFC<Invite> = (invite) => {
    const { inviterEmail, vault, token } = invite;
    const { itemCount, memberCount } = vault;
    const { onInviteResponse } = useInviteContext();

    const acceptInvite = useActionWithRequest({
        action: inviteAcceptIntent,
        requestId: inviteAcceptRequest(invite.token),
        onSuccess: onInviteResponse,
    });

    const rejectInvite = useActionWithRequest({
        action: inviteRejectIntent,
        requestId: inviteRejectRequest(invite.token),
        onSuccess: onInviteResponse,
    });

    const handleRejectInvite = () => rejectInvite.dispatch({ inviteToken: invite.token });
    const handleAcceptInvite = () => acceptInvite.dispatch({ inviteToken: token, inviterEmail });

    const loading = acceptInvite.loading || rejectInvite.loading;

    return (
        <ModalTwo size="small" open onClose={onInviteResponse} enableCloseWhenClickOutside>
            <ModalTwoHeader
                title={c('Title').t`Shared vault invitation`}
                subline={inviterEmail}
                className="text-center"
                hasClose={false}
            />
            <ModalTwoContent className="flex flex-column flex-align-items-center">
                <VaultIcon
                    color={vault.content.display.color}
                    icon={vault.content.display.icon}
                    size={32}
                    background
                    className="mb-2"
                />
                <div className="text-xl text-bold text-ellipsis max-w-full">{vault.content.name}</div>
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

                {acceptInvite.loading && (
                    <div className="ui-purple flex gap-x-2 flex-align-items-center">
                        <Progress
                            value={
                                invite.vault.itemCount > 0
                                    ? Math.round(100 * (acceptInvite.progress / invite.vault.itemCount))
                                    : 0
                            }
                            className="flex-item-fluid progress-bar--norm"
                        />

                        <small className="block">
                            {acceptInvite.progress} / {invite.vault.itemCount}
                        </small>
                        <CircleLoader size="small" />
                    </div>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
