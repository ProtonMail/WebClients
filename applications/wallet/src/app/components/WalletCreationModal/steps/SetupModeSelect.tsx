import { c } from 'ttag';

import { Button } from '../../../atoms';
import { WalletSetupScheme } from '../../../hooks/useWalletSetup/type';
import walletBitcoinSrc from './wallet-bitcoin.svg';

interface Props {
    onModeSelection: (mode: WalletSetupScheme.ManualCreation | WalletSetupScheme.WalletImport) => void;
}

export const SetupModeSelect = ({ onModeSelection }: Props) => {
    return (
        <div className="w-full flex flex-column">
            {/* Replace modal header to display the image */}
            <div className="flex flex-column">
                <div className="flex mx-auto mb-6">
                    <img
                        src={walletBitcoinSrc}
                        alt={c('Wallet setup').t`A wallet logo with Bitcoin sign in the top left corner`}
                    />
                </div>
                <h3 className="text-4xl text-bold mx-auto text-center">{c('Wallet setup').t`Setup your new wallet`}</h3>
                <div className="color-weak text-break mb-6">
                    <p className="text-center mx-7 my-2">
                        {c('Wallet setup').t`Get started and create a brand new wallet or import an existing one.`}
                    </p>
                </div>
            </div>

            <div className="flex">
                <Button
                    className="block w-4/5 mx-auto mb-2"
                    shape="solid"
                    color="norm"
                    onClick={() => onModeSelection(WalletSetupScheme.ManualCreation)}
                >{c('Wallet setup').t`Create a new wallet`}</Button>
                <Button
                    className="block w-4/5 mx-auto text-semibold"
                    shape="ghost"
                    color="weak"
                    size="medium"
                    onClick={() => onModeSelection(WalletSetupScheme.WalletImport)}
                >{c('Wallet setup').t`Import an existing wallet`}</Button>
            </div>
        </div>
    );
};
