import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { ModalOwnProps } from '@proton/components';
import { Prompt, SUBSCRIPTION_STEPS, Tooltip, useSubscriptionModal } from '@proton/components';
import { PLANS } from '@proton/payments';
import {
    hasBundle,
    hasBundlePro,
    hasBundlePro2024,
    hasDuo,
    hasFamily,
    hasVisionary,
} from '@proton/shared/lib/helpers/subscription';
import upgradeWalletSrc from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';

import { Button } from '../../atoms';
import type { SubTheme } from '../../utils';

export interface WalletUpgradeModalOwnProps {
    title?: string;
    theme?: SubTheme;
    content: string;
}

type Props = WalletUpgradeModalOwnProps & ModalOwnProps;

export const WalletUpgradeModal = ({ title, content, theme, ...modalProps }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const upgradeToVisionaryOnly =
        hasBundle(subscription) ||
        hasFamily(subscription) ||
        hasDuo(subscription) ||
        hasBundlePro(subscription) ||
        hasBundlePro2024(subscription);
    const hidden = hasVisionary(subscription);
    const subscriptionProps = upgradeToVisionaryOnly
        ? {
              step: SUBSCRIPTION_STEPS.CHECKOUT,
              disablePlanSelection: true,
              plan: PLANS.VISIONARY,
          }
        : {
              step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
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
                        onClick={() => {
                            openSubscriptionModal({
                                ...subscriptionProps,
                                onSubscribed: () => {
                                    modalProps.onClose?.();
                                },
                                metrics: {
                                    source: 'upsells',
                                },
                            });
                        }}
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
                    src={upgradeWalletSrc}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
                <h1 className="my-4 text-semibold text-3xl">
                    {(title ?? hidden)
                        ? c('Wallet Upgrade').t`You have reached your limit`
                        : c('Wallet Upgrade').t`Upgrade to support financial freedom`}
                </h1>
                <p className="mt-0 text-center">{content}</p>
            </div>
        </Prompt>
    );
};
