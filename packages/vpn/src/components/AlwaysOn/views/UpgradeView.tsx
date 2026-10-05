import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { PLANS } from '@proton/payments/core/constants';
import alwaysOnSmall from '@proton/styles/assets/img/illustrations/vpn/always-on/always-on-small.svg';

export const UpgradeView = () => {
    const [user] = useUser();
    const isAdmin = user.isAdmin && user.isSelf;

    const openSubscriptionModal = useSubscriptionModalRaw();

    const upgradeSubscription = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.VPN_BUSINESS,
        });

    return (
        <SettingsSectionWide>
            <PromotionBanner
                rounded
                mode="banner"
                contentCentered={false}
                icon={<img src={alwaysOnSmall} alt="" width={40} height={40} />}
                description={
                    <div>
                        <b>{c('Info').t`Available on VPN Professional`}</b>
                        <div>
                            {c('Info')
                                .t`With VPN Professional, admins can enforce always-on VPN for all organization members, alongside private gateways, access policies, and monitoring.`}
                        </div>
                    </div>
                }
                cta={
                    isAdmin && (
                        <Button
                            color="norm"
                            fullWidth
                            onClick={upgradeSubscription}
                            title={c('Title').t`Upgrade to enable Always-on`}
                        >
                            {c('Action').t`Upgrade to Professional`}
                        </Button>
                    )
                }
            />
        </SettingsSectionWide>
    );
};
