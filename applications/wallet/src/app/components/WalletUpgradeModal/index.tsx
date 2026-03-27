import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { hasVisionary } from '@proton/payments';
import walletAtSignDark from '@proton/styles/assets/img/wallet/wallet-at-sign-dark.png';
import walletAtSign from '@proton/styles/assets/img/wallet/wallet-at-sign.png';
import walletBitcoinDark from '@proton/styles/assets/img/wallet/wallet-bitcoin-dark.jpg';
import walletBitcoin from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';
import walletLockDark from '@proton/styles/assets/img/wallet/wallet-lock-dark.jpg';
import walletLock from '@proton/styles/assets/img/wallet/wallet-lock.jpg';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button } from '../../atoms';
import { useUpsellModal } from '../../hooks/useUpsellModal';
import { type SubTheme, WalletUpgradeBanner } from '../../utils';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';

export interface WalletUpgradeModalOwnProps {
    title?: string;
    theme?: SubTheme;
    content: string;
    banner?: WalletUpgradeBanner;
}

type Props = WalletUpgradeModalOwnProps & ModalOwnProps;

export const WalletUpgradeModal = ({ title, content, theme, banner, ...modalProps }: Props) => {
    const walletTheme = useWalletTheme();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openUpsellModal] = useUpsellModal(subscription);
    const hidden = hasVisionary(subscription);
    const getBanner = () => {
        const isDarkMode = walletTheme === WalletThemeOption.WalletDark;
        if (banner === WalletUpgradeBanner.AT_SIGN) {
            return isDarkMode ? walletAtSignDark : walletAtSign;
        } else if (banner === WalletUpgradeBanner.LOCK) {
            return isDarkMode ? walletLockDark : walletLock;
        }
        return isDarkMode ? walletBitcoinDark : walletBitcoin;
    };

    return (
        <Prompt
            {...modalProps}
            className={theme}
            buttons={[
                <Tooltip title={!user.canPay && c('Wallet upgrade').t`Contact your administrator to upgrade`}>
                    <Button
                        fullWidth
                        size="large"
                        shape="solid"
                        color="norm"
                        hidden={hidden}
                        disabled={!user.canPay}
                        onClick={openUpsellModal}
                    >
                        {c('Action').t`Upgrade now`}
                    </Button>
                </Tooltip>,
                <Button fullWidth size="large" shape="solid" color="weak" onClick={modalProps.onClose}>{c('Action')
                    .t`Close`}</Button>,
            ]}
        >
            <div className="flex flex-column items-center text-center">
                <img
                    src={getBanner()}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
                <h1 className="my-4 text-semibold text-3xl">
                    {title ??
                        (hidden
                            ? c('Wallet Upgrade').t`You have reached your limit`
                            : c('Wallet Upgrade').t`Upgrade to support financial freedom`)}
                </h1>
                <p className="mt-0 text-center">{content}</p>
            </div>
        </Prompt>
    );
};
