import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { WalletLogo } from '@proton/components/components';

import { BankCard } from './BankCard';

interface Props {
    onOpenWallet: () => void;
}

export const SetupConfirmation = ({ onOpenWallet }: Props) => {
    return (
        <div className="p-6 flex flex-column">
            <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your wallet is ready!`}</span>

            {/* Credit card design */}

            <BankCard width={24}>
                <div className="w-full flex flex-column flex-justify-space-between">
                    <WalletLogo variant="glyph-only" />

                    <div className="w-full flex flex-row flex-justify-space-between flex-align-items-end">
                        <span className="text-semibold">O BTC</span>
                        <div>
                            <span className="block text-right color-disabled">Bitcoin Wallet</span>
                            <span className="block text-right text-semibold">bc1p54***3297</span>
                        </div>
                    </div>
                </div>
            </BankCard>

            <Button className="mt-8" color="norm" onClick={onOpenWallet}>{c('Wallet setup')
                .t`Open your wallet`}</Button>
        </div>
    );
};
