import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmWallet } from '@proton/andromeda';
import { type ModalStateProps, PasswordInputTwo } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { type IWasmApiWalletData, encryptWalletDataWithWalletKey, getPassphraseLocalStorageKey } from '@proton/wallet';
import { setWalletPassphrase, useWalletDispatch } from '@proton/wallet/store';

import { Button, Input, Modal } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { isUndefined } from '../../utils';

interface Props {
    wallet: IWasmApiWalletData;
}

export const PassphraseInputModal = ({ wallet, ...modalProps }: Props & ModalStateProps) => {
    const dispatch = useWalletDispatch();
    const { network } = useBitcoinBlockchainContext();
    const [passphrase, setPassphrase] = useState('');
    const [loading, withLoading] = useLoading();

    const fingerPrint = useMemo(() => {
        if (!isUndefined(network) && wallet.Wallet.Mnemonic) {
            try {
                return new WasmWallet(network, wallet.Wallet.Mnemonic, passphrase).getFingerprint();
            } catch {
                return '';
            }
        }
    }, [network, passphrase, wallet.Wallet.Mnemonic]);

    const error = useMemo(() => {
        if (passphrase && fingerPrint !== wallet.Wallet.Fingerprint) {
            return c('Wallet passphrase').t`Fingerprint doesn't match stored one`;
        }

        return null;
    }, [passphrase, fingerPrint, wallet.Wallet.Fingerprint]);

    const handleConfirmPassphrase = async () => {
        dispatch(setWalletPassphrase({ walletID: wallet.Wallet.ID, passphrase }));
        if (wallet.WalletKey?.DecryptedKey && wallet.Wallet.Fingerprint) {
            const [encryptedPassphrase] = await encryptWalletDataWithWalletKey(
                [passphrase],
                wallet.WalletKey.DecryptedKey
            );

            localStorage.setItem(getPassphraseLocalStorageKey(wallet.Wallet.Fingerprint), encryptedPassphrase);
        }

        modalProps.onClose();
    };

    return (
        <Modal
            className="p-0"
            title={wallet.Wallet.Name}
            subline={c('Wallet passphrase').t`To use this wallet, you need to input the passphrase`}
            {...modalProps}
        >
            <div className="flex flex-column">
                <div className="flex flex-row mb-5">
                    <Input
                        id="passphrase-input"
                        disabled={loading}
                        as={PasswordInputTwo}
                        label={c('Wallet passphrase').t`Wallet passphrase`}
                        placeholder={c('Wallet passphrase').t`My wallet passphrase`}
                        value={passphrase}
                        error={error}
                        disbaled={loading}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            setPassphrase(event.target.value);
                        }}
                    />
                </div>

                <Button
                    disabled={!passphrase || Boolean(error) || loading}
                    className="block w-4/5 mx-auto mt-4 mb-2"
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        void withLoading(handleConfirmPassphrase());
                    }}
                >
                    {c('Wallet setup').t`Confirm`}
                </Button>
            </div>
        </Modal>
    );
};
