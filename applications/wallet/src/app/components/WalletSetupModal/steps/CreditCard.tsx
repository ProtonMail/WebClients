import { WalletLogo } from '@proton/components/components';

import { ColorGradientCard } from './ColorGradientCard';

interface Props {
    walletName: string;
    walletFingerprint: string;
}

export const CreditCard = ({ walletFingerprint, walletName }: Props) => {
    return (
        <ColorGradientCard width={24}>
            <div className="w-full flex flex-column justify-space-between h-full">
                <WalletLogo variant="glyph-only" />

                <div className="w-full flex flex-row justify-space-between items-end">
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
