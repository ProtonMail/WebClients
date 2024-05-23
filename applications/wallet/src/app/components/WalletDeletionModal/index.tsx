import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Modal } from '../../atoms';
import { useWalletDeletion } from './useWalletDeletion';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
}

export const WalletDeletionModal = ({ wallet, ...modalProps }: Props) => {
    const { loadingDeletion, handleWalletDeletion } = useWalletDeletion(wallet);

    return (
        <Modal
            title={c('Wallet preference').t`Your wallet deletion`}
            enableCloseWhenClickOutside
            size="large"
            {...modalProps}
        >
            <Card className="flex flex-column my-2 border border-danger">
                {loadingDeletion ? (
                    <CircleLoader className="color-primary" />
                ) : (
                    <span className="block">{c('Wallet preference')
                        .t`Are you sure you want to delete this wallet?`}</span>
                )}

                <div className="flex flex-row justify-end">
                    <Button
                        disabled={loadingDeletion}
                        shape="ghost"
                        color="danger"
                        size="small"
                        className="mr-2"
                        onClick={() => handleWalletDeletion()}
                    >{c('Wallet preference').t`Confirm deletion`}</Button>

                    <Button
                        disabled={loadingDeletion}
                        shape="solid"
                        color="norm"
                        size="small"
                        onClick={() => modalProps.onClose?.()}
                    >{c('Wallet preference').t`Cancel`}</Button>
                </div>
            </Card>
        </Modal>
    );
};
