import { type VFC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components/components';
import type { VaultShareContent } from '@proton/pass/types';

import { VaultIcon } from '../Vault/VaultIcon';

type Props = {
    vaultContent: VaultShareContent;
    inviterEmail: string;
    memberCount: number;
    itemCount: number;
} & Pick<ModalProps, 'open' | 'onClose'>;

export const VaultInvite: VFC<Props> = ({ vaultContent, inviterEmail, memberCount, itemCount, open, onClose }) => {
    return (
        <ModalTwo size="small" open={open} onClose={onClose}>
            <ModalTwoHeader
                title={c('Title').t`Shared vault invitation`}
                subline={inviterEmail}
                hasClose={false}
                className="text-center"
            />
            <ModalTwoContent className="flex flex-column flex-align-items-center">
                <VaultIcon
                    color={vaultContent.display.color}
                    icon={vaultContent.display.icon}
                    size={32}
                    background
                    className="mb-2"
                />
                <div className="text-xl text-bold text-ellipsis">{vaultContent.name}</div>
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
                <Button size="large" shape="solid" color="weak" onClick={onClose}>{c('Action')
                    .t`Reject invitation`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
