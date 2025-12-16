import { Children, type PropsWithChildren, createContext } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoad from '@proton/components/hooks/useLoad';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import {
    CYCLE,
    FREE_PLAN,
    type FreePlanDefault,
    PLANS,
    PLAN_NAMES,
    type Plan,
    getHasPlusPlan,
    getPlanByName,
    getPlansMap,
    getPricePerCycle,
    getSubscriptionPlanTitle,
    hasAllProductsB2CPlan,
    hasFreeOrPlus,
    hasVPN2024,
    isManagedExternally,
} from '@proton/payments';
import { getExploreText } from '@proton/shared/lib/apps/i18n';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import bundleLogo from './illustrations/bundle.svg';

interface AlsoInYourPlanSectionContextValue {
    app: APP_NAMES;
    plan: Plan | undefined;
    freePlan: FreePlanDefault;
    isBundlePlan: boolean;
}

export const AlsoInYourPlanSectionContext = createContext<AlsoInYourPlanSectionContextValue | undefined>(undefined);

const AlsoInYourPlanSection = ({ app, children }: PropsWithChildren<{ app: APP_NAMES }>) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const plan = PLANS.BUNDLE;
    const planIsManagedExternally = isManagedExternally(subscription);

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const freePlan = plansResult?.freePlan || FREE_PLAN;

    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);
    const loading = loadingSubscription || loadingPlans;

    if (!subscription || !plans || loading || !planName) {
        return <Loader />;
    }

    const currency = subscription.Currency || user?.Currency || 'USD';

    const plansMap = getPlansMap(plans, subscription.Currency, false);
    const bundle = getPlanByName(plansResult?.plans ?? [], plan, currency);
    const planPricePerCycle = getPricePerCycle(bundle, CYCLE.YEARLY) ?? 0;

    const priceString = bundle ? getSimplePriceString(currency, planPricePerCycle / CYCLE.YEARLY) : undefined;

    const sectionSubtitleCopy = () => {
        const planTitlePlusMaybeBrand = planName === PLANS.FREE ? `${BRAND_NAME} ${planTitle}` : planTitle;

        if (getHasPlusPlan(planName) && !hasVPN2024(subscription)) {
            return c('Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to ${VPN_APP_NAME} and other privacy services.`;
        }

        if (hasFreeOrPlus(subscription)) {
            return c('Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to all ${BRAND_NAME} privacy services.`;
        }

        if (hasAllProductsB2CPlan(subscription)) {
            // Translator: Examples: "Get more from your Visionary subscription", "Get more from your Duo subscription"
            return c('Dashboard').t`Get more from your ${planTitle} subscription.`;
        }
    };

    const showUnlimitedUpsell = user.canPay && hasFreeOrPlus(subscription) && !planIsManagedExternally;

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
            metrics: { source: 'upsells' },
        });
    };

    return (
        <AlsoInYourPlanSectionContext.Provider
            value={{
                app,
                freePlan,
                plan: planName ? plansMap[planName] : freePlan,
                isBundlePlan: hasAllProductsB2CPlan(subscription),
            }}
        >
            <DashboardGrid columns={Children.count(children)}>
                <DashboardGridSection spanAll="header">
                    <DashboardGridSectionHeader
                        title={c('Title').t`Also in your plan`}
                        subtitle={sectionSubtitleCopy()}
                    />
                </DashboardGridSection>
                {children}
                {showUnlimitedUpsell ? (
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
                ) : undefined}
            </DashboardGrid>
        </AlsoInYourPlanSectionContext.Provider>
    );
};

export default AlsoInYourPlanSection;
