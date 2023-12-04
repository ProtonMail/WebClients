import { WalletLogo } from '@proton/components/components';

import { ColorGradientCard } from './ColorGradientCard';

interface Props {
    walletName: string;
    walletFingerprint: string;
}

export const CreditCard = ({ walletFingerprint, walletName }: Props) => {
    return (
        <ColorGradientCard width={24}>
            <div className="w-full flex flex-column flex-justify-space-between h-full">
                <WalletLogo variant="glyph-only" />

                <div className="w-full flex flex-row flex-justify-space-between flex-align-items-end">
                    <span className="text-semibold">O BTC</span>
                    <div>
                        <span className="block text-right">{walletName}</span>
                        <span className="block text-right text-semibold">{walletFingerprint}</span>
                    </div>
                </div>
            </div>
        </ColorGradientCard>
    );
};
