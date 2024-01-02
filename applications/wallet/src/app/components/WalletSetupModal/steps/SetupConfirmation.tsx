import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';

import { WasmMnemonic, WasmNetwork, WasmWallet, WasmWalletConfig } from '../../../../pkg';
import { CreditCard } from './CreditCard';

interface Props {
    onOpenWallet: () => void;
    mnemonic?: WasmMnemonic;
    passphrase?: string;
}

export const SetupConfirmation = ({ onOpenWallet, mnemonic, passphrase }: Props) => {
    const walletConfig = new WasmWalletConfig(WasmNetwork.Testnet);
    const wallet = mnemonic ? new WasmWallet(mnemonic.asString(), passphrase, walletConfig) : null;

    return (
        <div className="p-6 flex flex-column">
            <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your wallet is ready!`}</span>

            {/* Credit card design */}
            {/* TODO: add name input somewhere or generated it randomly? */}
            {wallet && <CreditCard walletName="Bitcoin 01" walletFingerprint={wallet.getFingerprint()} />}

            <Button className="mt-8" color="norm" onClick={onOpenWallet}>{c('Wallet setup')
                .t`Open your wallet`}</Button>
        </div>
    );
};
