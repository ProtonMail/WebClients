import { Children, type PropsWithChildren, type ReactNode, createContext } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import useLoad from '@proton/components/hooks/useLoad';
import {
    FREE_PLAN,
    type FreePlanDefault,
    PLANS,
    type Plan,
    getHasPlusPlan,
    getPlansMap,
    getSubscriptionPlanTitle,
    hasAllProductsB2CPlan,
    hasFreeOrPlus,
    hasVPN2024,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

interface AlsoInYourPlanSectionContextValue {
    app: APP_NAMES;
    plan: Plan | undefined;
    freePlan: FreePlanDefault;
    isBundlePlan: boolean;
}

export const AlsoInYourPlanSectionContext = createContext<AlsoInYourPlanSectionContextValue | undefined>(undefined);

const AlsoInYourPlanSection = ({
    app,
    children,
    upsellBanner,
}: PropsWithChildren<{ app: APP_NAMES; upsellBanner?: ReactNode }>) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const freePlan = plansResult?.freePlan || FREE_PLAN;

    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);
    const loading = loadingSubscription || loadingPlans;

    if (!subscription || !plans || loading || !planName) {
        return <Loader />;
    }

    const plansMap = getPlansMap(plans, subscription.Currency, false);

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
                {upsellBanner}
            </DashboardGrid>
        </AlsoInYourPlanSectionContext.Provider>
    );
};

export default AlsoInYourPlanSection;
