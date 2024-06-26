import { c } from 'ttag';

import { Dropdown, Icon, usePopperAnchor } from '@proton/components/components';

import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

import './WalletNotFoundErrorDropdown.scss';

interface Props {
    email: string;
    hasSentInvite: boolean;
    onSendInvite: (email: string) => void;
}

export const WalletNotFoundErrorDropdown = ({ email, hasSentInvite, onSendInvite }: Props) => {
    const { anchorRef, isOpen, close, open } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <button
                ref={anchorRef}
                onClick={() => {
                    if (!hasSentInvite) {
                        open();
                    }
                }}
                className="ml-1 items-center flex-nowrap flex flex-row color-primary no-shrink"
            >
                <div className="no-shrink flex items-center px-2">
                    {hasSentInvite ? (
                        <>
                            <span className="block no-shrink mr-1">{c('Bitcoin send').t`Invitation sent`}</span>
                            <Icon name="paper-plane" />
                        </>
                    ) : (
                        <>
                            <Icon name="exclamation-circle" />
                            <span className="block no-shrink ml-1">{c('Bitcoin send').t`No wallet found`}</span>
                        </>
                    )}
                </div>
            </button>
            <Dropdown
                className="wallet-not-found-dropdown"
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{
                    width: '20rem',
                    maxWidth: '20rem',
                }}
                contentProps={{ className: 'wallet-not-found-dropdown' }}
            >
                <WalletNotFoundErrorContent onSendInvite={onSendInvite} email={email} dense />
            </Dropdown>
        </>
    );
};
