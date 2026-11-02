import { Children, type PropsWithChildren, type ReactNode, createContext } from 'react';

import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import { useSubscriptionForApp } from '@proton/payments-ui/ui/hooks/useSubscriptionForApp';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import {
    getPlanName,
    getSubscriptionPlanTitle,
    hasAllProductsB2CPlan,
    hasFreeOrPlus,
} from '@proton/payments/core/subscription/helpers';
import { getPlanNamesOfSubscriptions } from '@proton/payments/core/subscription/plan-names';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getHasPlusPlan } from '@proton/shared/lib/payments/plan/helpers';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';

import Loader from '../../../../../components/loader/Loader';
import useLoad from '../../../../../hooks/useLoad';

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
    title = c('Title').t`Also in your plan`,
    subtitle,
}: PropsWithChildren<{ app: APP_NAMES; upsellBanner?: ReactNode; title?: ReactNode; subtitle?: ReactNode }>) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscriptionForApp(app);
    const [allSubscriptions = []] = useAllSubscriptions();

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const freePlan = plansResult?.freePlan || FREE_PLAN;

    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription ?? FREE_SUBSCRIPTION);
    const loading = loadingSubscription || loadingPlans;

    if (!plans || loading || !planName) {
        return <Loader />;
    }

    const planNames = getPlanNamesOfSubscriptions(allSubscriptions, planName);
    const allProductsSubscription = allSubscriptions.find(hasAllProductsB2CPlan);

    const plan = (() => {
        const allProductsPlanName = getPlanName(allProductsSubscription);
        if (allProductsSubscription && allProductsPlanName) {
            return getPlansMap(plans, allProductsSubscription.Currency, false)[allProductsPlanName];
        }

        if (subscription) {
            return getPlansMap(plans, subscription.Currency, false)[planName];
        }

        return freePlan;
    })();

    const sectionSubtitleCopy = () => {
        const planTitlePlusMaybeBrand = planName === PLANS.FREE ? `${BRAND_NAME} ${planTitle}` : planTitle;

        if (subtitle) {
            return subtitle;
        }

        if (planNames.every(getHasPlusPlan) && !planNames.includes(PLANS.VPN2024)) {
            return c('Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to ${VPN_APP_NAME} and other privacy services.`;
        }

        if (allSubscriptions.every(hasFreeOrPlus)) {
            return c('Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to all ${BRAND_NAME} privacy services.`;
        }

        if (allProductsSubscription) {
            // Translator: Examples: "Get more from your Visionary subscription", "Get more from your Duo subscription"
            return c('Dashboard').t`Get more from your ${planTitle} subscription.`;
        }
    };

    return (
        <AlsoInYourPlanSectionContext.Provider
            value={{
                app,
                freePlan,
                plan,
                isBundlePlan: !!allProductsSubscription,
            }}
        >
            <DashboardGrid columns={Children.count(children)}>
                <DashboardGridSection spanAll="header">
                    <DashboardGridSectionHeader title={title} subtitle={sectionSubtitleCopy()} />
                </DashboardGridSection>
                {children}
                {upsellBanner}
            </DashboardGrid>
        </AlsoInYourPlanSectionContext.Provider>
    );
};

export default AlsoInYourPlanSection;
