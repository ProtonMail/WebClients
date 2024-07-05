import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import warningSignSrc from '@proton/styles/assets/img/illustrations/warning-sign.svg';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Modal } from '../../atoms';
import { useWalletDeletion } from './useWalletDeletion';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
}

export const WalletDeletionModal = ({ wallet, ...modalProps }: Props) => {
    const { loadingDeletion, handleWalletDeletion, openBackupModal } = useWalletDeletion({
        wallet,
        onDeletion: () => {
            modalProps.onClose?.();
        },
    });

    return (
        <Modal {...modalProps}>
            <div className="flex flex-column mb-4">
                <div className="flex mx-auto mb-6">
                    <img src={warningSignSrc} alt={c('Wallet deletion').t`Warning:'`} />
                </div>
                <h1 className="text-4xl text-bold mx-auto text-center">{c('Wallet deletion')
                    .t`Confirm to delete "${wallet.Wallet.Name}"`}</h1>

                <p className="color-weak text-center mx-12">
                    <span className="block my-2">{c('Wallet setup')
                        .t`Please backup your secret recovery phrase before you delete your wallet.`}</span>
                    <span className="block my-2">{c('Wallet setup')
                        .t`This mnemonic can help you restoring your wallet next time or on another compatible software.`}</span>
                </p>
            </div>

            <div className="flex flex-column">
                <Button
                    fullWidth
                    disabled={loadingDeletion}
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        openBackupModal();
                    }}
                >{c('Wallet preference').t`Back up wallet first`}</Button>

                <Button
                    fullWidth
                    disabled={loadingDeletion}
                    shape="solid"
                    color="weak"
                    onClick={() => {
                        handleWalletDeletion();
                    }}
                    className="mt-2 color-weak"
                >{c('Wallet preference').t`Delete this wallet`}</Button>
            </div>
        </Modal>
    );
};
