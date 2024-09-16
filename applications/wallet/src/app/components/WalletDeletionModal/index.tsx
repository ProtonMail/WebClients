import { useState } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { AuthModal, Prompt } from '@proton/components';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useBalance } from '../Balance/useBalance';
import { useWalletDeletion } from './useWalletDeletion';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
}

export const WalletDeletionModal = ({ wallet, ...modalProps }: Props) => {
    const [authed, setAuthed] = useState(false);
    const { loadingDeletion, handleWalletDeletion, openBackupModal } = useWalletDeletion({
        wallet,
        onDeletion: () => {
            modalProps.onClose?.();
        },
    });

    const { totalBalance } = useBalance(wallet);

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
                <Button
                    fullWidth
                    disabled={loadingDeletion}
                    shape="ghost"
                    onClick={() => {
                        openBackupModal();
                    }}
                >{c('Wallet preference').t`Copy seed phrase`}</Button>,
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
                <h1 className="text-4xl text-bold mx-auto text-center mb-4">{c('Wallet deletion')
                    .t`Are you sure you want to delete "${wallet.Wallet.Name}"`}</h1>

                {totalBalance > 0 ? (
                    <ModalParagraph>
                        <p className="color-danger mb-0">{c('Wallet setup')
                            .t`This wallet seems to still have assets.`}</p>
                        <p>
                            {c('Wallet setup')
                                .t`Please transfer them to another wallet before deleting. Deleting this wallet will remove all its data from ${BRAND_NAME}'s servers. However, you can recover the wallet later if you have its seed phrase.`}
                        </p>
                    </ModalParagraph>
                ) : (
                    <ModalParagraph>
                        <p>
                            {c('Wallet setup')
                                .t`Deleting this wallet will remove all its data from ${BRAND_NAME}'s servers. However, you can recover the wallet later if you have its seed phrase.`}
                        </p>
                    </ModalParagraph>
                )}
            </div>
        </Prompt>
    );
};
