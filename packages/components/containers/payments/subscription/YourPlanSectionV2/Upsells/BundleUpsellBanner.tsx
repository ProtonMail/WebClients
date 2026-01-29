import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGridSection } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import useLoad from '@proton/components/hooks/useLoad';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import {
    CYCLE,
    PLANS,
    PLAN_NAMES,
    getPlanByName,
    getPricePerCycle,
    hasFreeOrPlus,
    isManagedExternally,
} from '@proton/payments';
import { getExploreText } from '@proton/shared/lib/apps/i18n';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import bundleLogo from '../images/bundle.svg';

const BundleUpsellBanner = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = PLANS.BUNDLE;
    const planIsManagedExternally = isManagedExternally(subscription);

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;

    const loading = loadingSubscription || loadingPlans;

    if (!subscription || !plans || loading) {
        return null;
    }

    const currency = subscription.Currency || user?.Currency || 'USD';

    const bundle = getPlanByName(plansResult?.plans ?? [], plan, currency);
    const planPricePerCycle = getPricePerCycle(bundle, CYCLE.YEARLY) ?? 0;

    const priceString = bundle ? getSimplePriceString(currency, planPricePerCycle / CYCLE.YEARLY) : undefined;

    const showUnlimitedUpsellBanner = user.canPay && hasFreeOrPlus(subscription) && !planIsManagedExternally;

    if (!showUnlimitedUpsellBanner) {
        return null;
    }

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    return (
        <DashboardGridSection spanAll="footer">
            <PromotionBanner
                rounded="lg"
                mode="banner"
                gradient="vertical"
                contentCentered={false}
                description={
                    <div className="flex flex-nowrap items-center gap-3 p-1">
                        <div className="flex shrink-0 items-center justify-center rounded-lg bg-norm p-2 flex-column md:flex-row flex-nowrap text-left">
                            <img src={bundleLogo} alt="" className="w-12 ratio-square" />
                        </div>
                        <div className="text-left">
                            <b className="color-hint text-sm text-semibold">{c('Info').t`Did you know?`}</b>
                            <p className="m-0 text-lg color-norm">
                                {priceString &&
                                    getBoldFormattedText(
                                        c('Info')
                                            .t`You can get our premium privacy services in one bundle—and it’s just **${priceString}/month**.`
                                    )}
                            </p>
                        </div>
                    </div>
                }
                cta={
                    <Button
                        color="norm"
                        shape="ghost"
                        className="flex items-center gap-1 flex-nowrap"
                        onClick={handleGetPlan}
                    >
                        {getExploreText(PLAN_NAMES[plan])}
                        <IcArrowRight className="shrink-0" />
                    </Button>
                }
            />
        </DashboardGridSection>
    );
};

export default BundleUpsellBanner;
