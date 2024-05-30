import { c } from 'ttag';

import { Dropdown, Icon, usePopperAnchor } from '@proton/components/components';

import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

import './WalletNotFoundErrorDropdown.scss';

interface Props {
    email: String;
}

export const WalletNotFoundErrorDropdown = ({ email }: Props) => {
    const { anchorRef, isOpen, close, open } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <button
                ref={anchorRef}
                onClick={open}
                className="ml-1 items-center flex-nowrap flex flex-row color-primary no-shrink"
            >
                <span className="block no-shrink">{c('Bitcoin send').t`No wallet found`}</span>
                <div className="no-shrink ml-1 flex">
                    <Icon name="exclamation-circle" />
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
                <WalletNotFoundErrorContent email={email} dense />
            </Dropdown>
        </>
    );
};
