import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { useBundleProPlan } from '@proton/components/hooks/useHasPlan';
import { PLANS } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';
import lightlabellingUpsellSvg from '@proton/styles/assets/img/illustrations/account-lightlabelling-upsell.svg';

interface UpsellBannerProps {
    organization: Organization;
    canAccessLightLabelling: boolean;
    isPartOfFamily: boolean;
}

export const OrganizationLogoUploadUpsellBanner = ({
    organization,
    canAccessLightLabelling,
    isPartOfFamily,
}: UpsellBannerProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const bundleProPlan = useBundleProPlan();

    const currentPlan = organization.PlanName;

    const isVisionary = currentPlan === PLANS.VISIONARY;

    const upgradePlanMapping: { [key in PLANS]?: PLANS } = {
        [PLANS.MAIL_PRO]: bundleProPlan,
        [PLANS.VPN_PRO]: PLANS.VPN_BUSINESS,
        [PLANS.PASS_PRO]: PLANS.PASS_BUSINESS,
    };

    const handleUpgradeClick = () => {
        const newPlan = upgradePlanMapping[currentPlan as PLANS];

        if (newPlan) {
            openSubscriptionModal({
                metrics: {
                    source: 'upsells',
                },
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                plan: newPlan,
            });
        }
    };

    if (canAccessLightLabelling || isPartOfFamily || isVisionary) {
        return;
    }

    return (
        <PromotionBanner
            mode="banner"
            rounded
            contentCentered={false}
            icon={<img width="45" src={lightlabellingUpsellSvg} alt="" className="shrink-0" />}
            description={
                <div>
                    <b>{c('Info').t`Custom branding`}</b>
                    <div>
                        {c('Info')
                            .t`Upload your organization’s logo to boost your brand identity and create a personalized experience for your users.`}
                    </div>
                </div>
            }
            cta={
                <Button color="norm" fullWidth onClick={handleUpgradeClick}>
                    {c('Action').t`Upgrade to Business`}
                </Button>
            }
        />
    );
};
