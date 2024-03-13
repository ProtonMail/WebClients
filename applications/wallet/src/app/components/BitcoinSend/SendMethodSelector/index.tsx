import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Pill } from '@proton/atoms/Pill';
import { WalletType } from '@proton/wallet';

const AvailableAccount = ({ count }: { count: number }) => {
    if (!count) {
        return (
            <Pill backgroundColor="#ffa79d" className="mt-3">{c('Wallet send')
                .t`No account with sufficient balance`}</Pill>
        );
    }

    return (
        <Pill backgroundColor="#d0ffb7" className="mt-3">
            {c('Wallet send').ngettext(
                msgid`${count} account with sufficient balance`,
                `${count} accounts with sufficient balance`,
                count
            )}
        </Pill>
    );
};

interface Props {
    onSelectSendMethod: (method: WalletType) => void;
}

export const SendMethodSelector = ({ onSelectSendMethod }: Props) => {
    const [onchainCount, lightningCount] = [3, 0];

    return (
        <div className="py-6 px-8 h-full flex flex-column">
            <Button
                className="w-custom mx-auto text-left py-4"
                style={{ '--w-custom': '20rem' }}
                disabled={!onchainCount}
                onClick={() => onSelectSendMethod(WalletType.OnChain)}
            >
                <span className="block text-lg">{c('Wallet Send').t`Pay Onchain`}</span>
                <p className="m-0 mt-2">{c('Wallet Send')
                    .t`Onchain payments are usually slower and used for large amounts`}</p>

                <AvailableAccount count={onchainCount} />
            </Button>

            <Button
                className="w-custom mt-4 mx-auto text-left py-4"
                style={{ '--w-custom': '20rem' }}
                disabled={!lightningCount}
                onClick={() => onSelectSendMethod(WalletType.Lightning)}
            >
                <span className="block text-lg">{c('Wallet Send').t`Pay with Lighting`}</span>
                <p className="m-0 mt-2">{c('Wallet Send')
                    .t`Using Lightning enables faster payments, well suited for small amounts`}</p>

                <AvailableAccount count={lightningCount} />
            </Button>
        </div>
    );
};
