import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt, SUBSCRIPTION_STEPS, Tooltip, useSubscriptionModal } from '@proton/components';
import { useUser } from '@proton/components/hooks';
import { PLANS } from '@proton/shared/lib/constants';
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
                        disabled={!user.canPay}
                        onClick={() => {
                            openSubscriptionModal({
                                step: SUBSCRIPTION_STEPS.CHECKOUT,
                                disablePlanSelection: true,
                                plan: PLANS.VISIONARY,
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
                    {title ?? c('Wallet Upgrade').t`Upgrade to support financial freedom`}
                </h1>
                <p className="mt-0 text-center">{content}</p>
            </div>
        </Prompt>
    );
};
