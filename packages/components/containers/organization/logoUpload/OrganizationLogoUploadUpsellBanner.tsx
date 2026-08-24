import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS } from '@proton/payments/core/constants';
import type { Organization } from '@proton/shared/lib/interfaces';
import lightlabellingUpsellSvg from '@proton/styles/assets/img/illustrations/account-lightlabelling-upsell.svg';

import { useBundleProPlan } from '../../../hooks/useHasPlan';
import { PromotionBanner } from '../../banner/PromotionBanner';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';

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
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
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
            void openSubscriptionModal({
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
                <Button color="norm" fullWidth onClick={handleUpgradeClick} loading={loadingSubscriptionModal}>
                    {c('Action').t`Upgrade to Business`}
                </Button>
            }
        />
    );
};
