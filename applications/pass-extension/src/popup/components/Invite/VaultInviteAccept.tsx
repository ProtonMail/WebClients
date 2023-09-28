import { type VFC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import type { Invite } from '@proton/pass/types/data/invites';

import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { VaultIcon } from '../Vault/VaultIcon';

type Props = Invite;

export const VaultInviteAccept: VFC<Props> = (invite) => {
    const { inviterEmail, vault } = invite;
    const { itemCount, memberCount } = vault;
    const { rejectInvite } = useInviteContext();

    return (
        <ModalTwo size="small" open onClose={() => rejectInvite(invite)}>
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
                <Button size="large" shape="solid" color="norm">{c('Action').t`Join shared vault`}</Button>
                <Button size="large" shape="solid" color="weak" onClick={() => rejectInvite(invite)}>{c('Action')
                    .t`Reject invitation`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
