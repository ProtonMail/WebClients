import { useState } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Icon } from '@proton/components';
import { AuthModal, Prompt } from '@proton/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useConfig from '@proton/components/hooks/useConfig';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, ButtonLike } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useBalance } from '../Balance/useBalance';
import { useWalletDeletion } from './useWalletDeletion';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
}

export const WalletDeletionModal = ({ wallet, ...modalProps }: Props) => {
    const { APP_NAME } = useConfig();
    const [authed, setAuthed] = useState(false);
    const { loadingDeletion, handleWalletDeletion, openBackupModal } = useWalletDeletion({
        wallet,
        onDeletion: () => {
            modalProps.onClose?.();
        },
    });

    const { balance } = useBalance(wallet);

    const headerWithWalletName = c('Wallet deletion').t`Are you sure you want to delete "${wallet.Wallet.Name}"`;
    const headerWithoutWalletName = c('Wallet deletion').t`Are you sure you want to delete this wallet`;

    if (!authed) {
        return (
            <AuthModal
                open={modalProps.open}
                onCancel={modalProps.onClose}
                config={unlockPasswordChanges()}
                onSuccess={async () => {
                    setAuthed(true);
                }}
            />
        );
    }

    return (
        <Prompt
            {...modalProps}
            buttons={[
                wallet.IsNotDecryptable ? (
                    <ButtonLike
                        fullWidth
                        disabled={loadingDeletion}
                        as={SettingsLink}
                        path={'/mail/encryption-keys'}
                        app={APP_NAME}
                        target="_blank"
                        color="info"
                    >
                        {c('Title').t`Go to settings and recovery keys`}
                        <Icon alt={c('Action').t`Go to settings`} name="arrow-out-square" className="ml-2" />
                    </ButtonLike>
                ) : (
                    <Button
                        fullWidth
                        disabled={loadingDeletion}
                        shape="ghost"
                        onClick={() => {
                            openBackupModal();
                        }}
                    >{c('Wallet preference').t`Copy seed phrase`}</Button>
                ),
                <Button
                    fullWidth
                    disabled={loadingDeletion}
                    shape="solid"
                    color="danger"
                    onClick={() => {
                        handleWalletDeletion();
                    }}
                >{c('Wallet preference').t`Delete wallet now`}</Button>,
                <Button fullWidth disabled={loadingDeletion} shape="ghost" color="norm" onClick={modalProps.onClose}>{c(
                    'Wallet preference'
                ).t`Not now`}</Button>,
            ]}
        >
            <div className="flex flex-column mb-4">
                <h1 className="text-4xl text-bold mx-auto text-center mb-4">
                    {wallet.IsNotDecryptable ? headerWithoutWalletName : headerWithWalletName}
                </h1>

                {balance > 0 ? (
                    <ModalParagraph>
                        <p className="color-danger mb-0">{c('Wallet setup')
                            .t`This wallet seems to still have assets.`}</p>
                        <p>
                            {c('Wallet setup')
                                .t`Please transfer your bitcoins to another wallet before deleting. Deleting this wallet will remove all its data from ${BRAND_NAME}'s servers. You can recover this wallet at a later stage using the seed phrase.`}
                        </p>
                    </ModalParagraph>
                ) : wallet.IsNotDecryptable ? (
                    <ModalParagraph>
                        <p>
                            {c('Wallet setup')
                                .t`Deleting this wallet will remove all its data from ${BRAND_NAME}'s servers. You can recover the wallet by reactivating the keys used during wallet creation in your account.`}
                        </p>
                    </ModalParagraph>
                ) : (
                    <ModalParagraph>
                        <p>
                            {c('Wallet setup')
                                .t`Deleting this wallet will remove all its data from ${BRAND_NAME}'s servers. You can recover the wallet at a later stage using the seed phrase.`}
                        </p>
                    </ModalParagraph>
                )}
            </div>
        </Prompt>
    );
};
