import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import { WasmMnemonic, WasmWallet } from '../../../../pkg';
import { useOnchainWalletContext } from '../../../contexts';
import { CreditCard } from './CreditCard';

interface Props {
    onOpenWallet: () => void;
    mnemonic?: WasmMnemonic;
    passphrase?: string;
    walletName: string;
}

export const SetupConfirmation = ({ onOpenWallet, mnemonic, passphrase, walletName }: Props) => {
    const { network } = useOnchainWalletContext();

    const wallet = mnemonic ? new WasmWallet(network, mnemonic.asString(), passphrase) : null;

    return (
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column flex-nowrap">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your wallet is ready!`}</span>

                {/* Credit card design */}
                {/* TODO: add name input somewhere or generated it randomly? */}
                {wallet && <CreditCard walletName={walletName} walletFingerprint={wallet.getFingerprint()} />}

                <Button className="mt-8" color="norm" onClick={onOpenWallet}>{c('Wallet setup')
                    .t`Open your wallet`}</Button>
            </div>
        </ModalContent>
    );
};
