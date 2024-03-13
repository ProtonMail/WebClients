import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmWallet } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { Alert, ModalTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../contexts';

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
        if (network && wallet.Wallet.Mnemonic) {
            try {
                return new WasmWallet(network, wallet.Wallet.Mnemonic, passphrase).getFingerprint();
            } catch {
                return '';
            }
        }
    }, [network, passphrase, wallet.Wallet.Mnemonic]);

    return (
        <ModalTwo className="p-0" open={isOpen} onClose={onClose}>
            <ModalTwoHeader title={wallet.Wallet.Name} />
            <ModalContent>
                <p className="color-hint text-justify mt-2 mb-6">
                    {c('Wallet passphrase').t`To access this wallet, you need to input the passphrase`}
                </p>

                <div className="flex flex-row mb-5">
                    <label className="w-1/4 mr-2 text-semibold block mt-2" htmlFor="passphrase-input">
                        <span>{c('Wallet passphrase').t`Passphrase`}</span>
                    </label>

                    <div className="w-2/4">
                        <Input
                            id="passphrase-input"
                            placeholder={c('Wallet passphrase').t`Wallet passphrase`}
                            value={passphrase}
                            onChange={(event) => {
                                setPassphrase(event.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-row">
                    {fingerPrint !== wallet.Wallet.Fingerprint ? (
                        <Alert type="warning">{c('Wallet passphrase').t`Fingerprint doesn't match stored one`}</Alert>
                    ) : (
                        <Alert type="success">{c('Wallet passphrase').t`Fingerprint matches stored one`}</Alert>
                    )}
                </div>
            </ModalContent>

            <ModalTwoFooter>
                <Button onClick={() => onClose()} className="ml-auto">{c('Wallet passphrase').t`Cancel`}</Button>
                <Button
                    className="ml-3"
                    color="norm"
                    // disabled={fingerPrint !== wallet.Wallet.Fingerprint}
                    onClick={() => onConfirmPassphrase(passphrase)}
                >{c('Wallet passphrase').t`Confirm`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
