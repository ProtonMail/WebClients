import { c } from 'ttag';

import { Dropdown, Icon, usePopperAnchor } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { Button } from '../../atoms';
import walletNotFoundImg from './wallet_not_found.svg';

export const WalletNotFoundErrorDropdown = () => {
    const { anchorRef, isOpen, close, open } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <button
                ref={anchorRef}
                onClick={open}
                className="ml-1 items-center flex-nowrap flex flex-row color-primary"
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
                <div className="flex flex-column p-6">
                    <div className="flex flex-row items-center mb-6">
                        <div className="mr-4">
                            <img
                                src={walletNotFoundImg}
                                alt={c('Wallet send')
                                    .t`A user icon with an exclamation mark, meaning that something unexpected happened`}
                            />
                        </div>
                        <div className="flex flex-column">
                            <span className="block text-lg">{c('Bitcoin send').t`No wallet found`}</span>
                            <span className="block color-hint">ericnorbert@proton.me</span>
                        </div>
                    </div>

                    <hr className="m-0" />

                    <p className="my-4 text-center">
                        {c('Bitcoin send')
                            .t`This email is not using a ${WALLET_APP_NAME} yet. Invite them to create their own wallet for easier transactions.`}
                    </p>

                    <Button color="norm" shape="solid" fullWidth pill>{c('Bitcoin send').t`Send invitation`}</Button>
                </div>
            </Dropdown>
        </>
    );
};
