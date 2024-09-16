import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmWallet } from '@proton/andromeda';
import { PasswordInputTwo } from '@proton/components';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { isUndefined } from '../../utils';

interface Props {
    wallet: IWasmApiWalletData;
    isOpen: boolean;
    onClose: () => void;
    onConfirmPassphrase: (walletPassphrase: string) => void;
}

export const PassphraseInputModal = ({ wallet, isOpen, onClose, onConfirmPassphrase }: Props) => {
    const { network } = useBitcoinBlockchainContext();
    const [passphrase, setPassphrase] = useState('');

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

    return (
        <Modal
            className="p-0"
            open={isOpen}
            onClose={onClose}
            title={wallet.Wallet.Name}
            subline={c('Wallet passphrase').t`To access this wallet, you need to input the passphrase`}
        >
            <div className="flex flex-column">
                <div className="flex flex-row mb-5">
                    <Input
                        id="passphrase-input"
                        as={PasswordInputTwo}
                        label={c('Wallet passphrase').t`Wallet passphrase`}
                        placeholder={c('Wallet passphrase').t`My wallet passphrase`}
                        value={passphrase}
                        error={error}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                            setPassphrase(event.target.value);
                        }}
                    />
                </div>

                <Button
                    disabled={!passphrase || Boolean(error)}
                    className="block w-4/5 mx-auto mt-4 mb-2"
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        onConfirmPassphrase(passphrase);
                    }}
                >
                    {c('Wallet setup').t`Confirm`}
                </Button>
            </div>
        </Modal>
    );
};
