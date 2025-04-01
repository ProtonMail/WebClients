import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';
import useLoad from '@proton/components/hooks/useLoad';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import type { FullPlansMap } from '@proton/payments';
import { CYCLE, type FreePlanDefault, type Subscription } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { hasBundle, hasDeprecatedVPN, hasDuo, hasFamily, hasVPN2024 } from '@proton/shared/lib/helpers/subscription';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import useVariant from '@proton/unleash/useVariant';

import DuoBannerExtendSubscription from './Upsells/DuoBannerExtendSubscription';
import ExploreGroupPlansBanner from './Upsells/ExploreGroupPlansBanner';
import FamilyBanner from './Upsells/FamilyBanner';
import FamilyBannerExtendSubscription from './Upsells/FamilyBannerExtendSubscription';
import UnlimitedBannerExtendSubscription from './Upsells/UnlimitedBannerExtendSubscription';
import UnlimitedBannerGradient from './Upsells/UnlimitedBannerGradient';
import UnlimitedBannerPlain from './Upsells/UnlimitedBannerPlain';
import VpnPlusExtendSubscription from './Upsells/VpnPlusExtendSubscription';
import VpnPlusFromFree from './Upsells/VpnPlusFromFree';

export interface UpsellSectionBaseProps {
    app: APP_NAMES;
    subscription: Subscription;
}
export interface UpsellSectionProps extends UpsellSectionBaseProps {
    user: UserModel;
    plansMap: FullPlansMap;
    serversCount: VPNServersCountData;
    freePlan: FreePlanDefault;
    show24MonthPlan: boolean;
}

interface GetUpsellSectionProps {
    subscription: Subscription;
    app: APP_NAMES;
    user: UserModel;
    serversCount: VPNServersCountData;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    subscriptionEnd: number;
    variant: { name?: VPNDashboardVariant | 'disabled' | undefined };
}

const getUpsellSection = ({
    subscription,
    app,
    user,
    serversCount,
    plansMap,
    freePlan,
    subscriptionEnd,
}: GetUpsellSectionProps) => {
    const isFree = user.isFree;

    const hasMailFree = isFree && app === APPS.PROTONMAIL;
    const hasDriveFree = isFree && app === APPS.PROTONDRIVE;
    const hasPassFree = isFree && app === APPS.PROTONPASS && !user.hasPassLifetime;
    const hasVPNFree = isFree && app === APPS.PROTONVPN_SETTINGS;

    const userCanHave24MonthPlan = user.isFree && user.canPay && !user.isDelinquent && !subscriptionEnd;

    if (hasMailFree || hasPassFree || hasVPNFree || hasDriveFree) {
        return (
            <>
                <VpnPlusFromFree
                    user={user}
                    subscription={subscription}
                    serversCount={serversCount}
                    app={app}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    show24MonthPlan={userCanHave24MonthPlan}
                />
                <UnlimitedBannerGradient
                    user={user}
                    subscription={subscription}
                    serversCount={serversCount}
                    app={app}
                    showProductCards={false}
                    showUpsellPanels={false}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    show24MonthPlan={userCanHave24MonthPlan}
                />
            </>
        );
    }

    if ((hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && subscription.Cycle === CYCLE.YEARLY) {
        return (
            <UnlimitedBannerGradient
                user={user}
                subscription={subscription}
                serversCount={serversCount}
                app={app}
                showProductCards={true}
                showUpsellPanels={true}
                plansMap={plansMap}
                freePlan={freePlan}
                show24MonthPlan={userCanHave24MonthPlan}
                gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
            />
        );
    }

    if ((hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && subscription.Cycle === CYCLE.TWO_YEARS) {
        return (
            <UnlimitedBannerGradient
                user={user}
                subscription={subscription}
                serversCount={serversCount}
                app={app}
                showProductCards={true}
                showUpsellPanels={false}
                showDiscoverButton={false}
                showUpsellHeader={true}
                plansMap={plansMap}
                freePlan={freePlan}
                show24MonthPlan={userCanHave24MonthPlan}
            />
        );
    }

    // Catch all cycles except yearly or two years
    if (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) {
        return (
            <>
                <VpnPlusExtendSubscription
                    user={user}
                    subscription={subscription}
                    serversCount={serversCount}
                    app={app}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    show24MonthPlan={userCanHave24MonthPlan}
                />
                <UnlimitedBannerPlain app={app} subscription={subscription} />
            </>
        );
    }

    if (hasBundle(subscription) && subscription.Cycle === CYCLE.MONTHLY) {
        return (
            <UnlimitedBannerExtendSubscription
                user={user}
                subscription={subscription}
                serversCount={serversCount}
                app={app}
                showUpsellPanels={true}
                plansMap={plansMap}
                freePlan={freePlan}
                show24MonthPlan={userCanHave24MonthPlan}
            />
        );
    }

    if (hasBundle(subscription) && subscription.Cycle !== CYCLE.MONTHLY) {
        return <ExploreGroupPlansBanner app={app} subscription={subscription} />;
    }

    if (hasDuo(subscription) && subscription.Cycle === CYCLE.MONTHLY) {
        return (
            <DuoBannerExtendSubscription
                user={user}
                subscription={subscription}
                serversCount={serversCount}
                app={app}
                showUpsellPanels={true}
                plansMap={plansMap}
                freePlan={freePlan}
                show24MonthPlan={userCanHave24MonthPlan}
            />
        );
    }

    if (hasDuo(subscription) && subscription.Cycle !== CYCLE.MONTHLY) {
        return <FamilyBanner app={app} subscription={subscription} />;
    }

    if (hasFamily(subscription) && subscription.Cycle === CYCLE.MONTHLY) {
        return (
            <FamilyBannerExtendSubscription
                user={user}
                subscription={subscription}
                serversCount={serversCount}
                app={app}
                showUpsellPanels={true}
                plansMap={plansMap}
                freePlan={freePlan}
                show24MonthPlan={userCanHave24MonthPlan}
            />
        );
    }

    return null;
};

interface YourPlanSectionV2Props {
    app: APP_NAMES;
}

const YourPlanUpsellsSectionV2 = ({ app }: YourPlanSectionV2Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [subscriptionEnd, loadingSubscriptionEnd] = useLastSubscriptionEnd();
    const variant = useVariant('VPNDashboard');

    useLoad();

    const loading =
        loadingSubscription || loadingPlans || serversCountLoading || plansMapLoading || loadingSubscriptionEnd;

    if (!subscription || !plans || loading) {
        return <Loader />;
    }

    return getUpsellSection({
        app,
        subscription,
        user,
        serversCount,
        freePlan,
        plansMap,
        subscriptionEnd,
        variant,
    });
};
export default YourPlanUpsellsSectionV2;
