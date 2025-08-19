import { useEffect } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useLoad from '@proton/components/hooks/useLoad';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { type TelemetryPaymentFlow } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import useLoading from '@proton/hooks/useLoading';
import type { FreeSubscription, FullPlansMap } from '@proton/payments';
import { CYCLE, type FreePlanDefault, type Subscription, hasLumoPlan } from '@proton/payments';
import { FREE_PLAN } from '@proton/payments';
import { hasBundle, hasDeprecatedVPN, hasDuo, hasFamily, hasVPN2024 } from '@proton/payments';
import { PaymentsContextProvider, usePaymentsPreloaded } from '@proton/payments/ui';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import useVariant from '@proton/unleash/useVariant';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { type Upsell } from '../helpers';
import CurrentPlanInfoWithUpsellSection from './Upsells/CurrentPlanInfoSection';
import DuoBanner from './Upsells/DuoBanner';
import DuoBannerExtendSubscription, { useDuoBannerExtendSubscription } from './Upsells/DuoBannerExtendSubscription';
import ExploreGroupPlansBanner from './Upsells/ExploreGroupPlansBanner';
import FamilyBanner from './Upsells/FamilyBanner';
import FamilyBannerExtendSubscription, {
    useFamilyBannerExtendSubscription,
} from './Upsells/FamilyBannerExtendSubscription';
import UnlimitedBannerExtendSubscription, {
    useUnlimitedBannerExtendSubscription,
} from './Upsells/UnlimitedBannerExtendSubscription';
import UnlimitedBannerGradient, { useUnlimitedBannerGradientUpsells } from './Upsells/UnlimitedBannerGradient';
import UnlimitedBannerPlain from './Upsells/UnlimitedBannerPlain';
import VPNB2BBanner from './Upsells/VPNB2BBanner';
import VpnPlusExtendSubscription, { useVpnPlusExtendSubscription } from './Upsells/VpnPlusExtendSubscription';
import VpnPlusFromFree, { useVpnPlusFromFreeUpsells } from './Upsells/VpnPlusFromFree';

export interface UpsellSectionBaseProps {
    app: APP_NAMES;
    subscription?: Subscription | FreeSubscription;
}
export interface UpsellSectionProps extends UpsellSectionBaseProps {
    user: UserModel;
    plansMap: FullPlansMap;
    serversCount: VPNServersCountData;
    freePlan: FreePlanDefault;
    show24MonthPlan: boolean;
}

interface GetUpsellSectionProps {
    subscription?: Subscription | FreeSubscription;
    app: APP_NAMES;
    user: UserModel;
    serversCount: VPNServersCountData;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    variant: { name?: VPNDashboardVariant | 'disabled' | undefined };
}

export type UpsellsHook = {
    upsells: Upsell[];
    handleExplorePlans: () => void;
    serversCount: VPNServersCountData;
    telemetryFlow: TelemetryPaymentFlow;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    user: UserModel;
};

const useUpsellSection = ({ subscription, app, user, serversCount, plansMap, freePlan }: GetUpsellSectionProps) => {
    const isFree = user.isFree;

    const variant = useVariant('VPNDashboard');

    const showAVariant = variant.name === 'A';
    const showBVariant = variant.name === 'B';

    const hasMailFree = isFree && app === APPS.PROTONMAIL;
    const hasDriveFree = isFree && app === APPS.PROTONDRIVE;
    const hasPassFree = isFree && app === APPS.PROTONPASS && !user.hasPassLifetime;
    const hasVPNFree = isFree && app === APPS.PROTONVPN_SETTINGS;
    const hasLumo = hasLumoPlan(subscription);

    // Allow 24 month plan but conditions might change again
    const userCanHave24MonthPlan = true;

    const upsellParams = {
        subscription,
        serversCount,
        app,
        plansMap,
        freePlan,
        show24MonthPlan: userCanHave24MonthPlan,
        user,
    };

    const vpnPlusFromFreeUpsells = useVpnPlusFromFreeUpsells(upsellParams);
    const unlimitedBannerGradientUpsells = useUnlimitedBannerGradientUpsells(upsellParams);
    const vpnPlusExtendSubscriptionUpsells = useVpnPlusExtendSubscription(upsellParams);
    const unlimitedBannerExtendSubscriptionUpsells = useUnlimitedBannerExtendSubscription(upsellParams);
    const duoBannerExtendSubscriptionUpsells = useDuoBannerExtendSubscription(upsellParams);
    const familyBannerExtendSubscriptionUpsells = useFamilyBannerExtendSubscription(upsellParams);

    const upsellSections = [
        {
            enabled:
                (hasMailFree ||
                    hasPassFree ||
                    hasVPNFree ||
                    hasDriveFree ||
                    // We want to show the VPN upsells to users with Lumo plan since they migrate from the Lumo plan to having a Lumo addon
                    hasLumo) &&
                showAVariant,
            upsells: [...vpnPlusFromFreeUpsells.upsells, ...unlimitedBannerGradientUpsells.upsells],
            element: (
                <>
                    <VpnPlusFromFree subscription={subscription as Subscription} {...vpnPlusFromFreeUpsells} />
                    <UnlimitedBannerGradient
                        showProductCards={false}
                        showUpsellPanels={false}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                </>
            ),
        },
        {
            enabled:
                (hasMailFree ||
                    hasPassFree ||
                    hasVPNFree ||
                    hasDriveFree ||
                    // We want to show the VPN upsells to users with Lumo plan since they migrate from the Lumo plan to having a Lumo addon
                    hasLumo) &&
                showBVariant,
            upsells: [...vpnPlusFromFreeUpsells.upsells, ...unlimitedBannerGradientUpsells.upsells],
            element: (
                <CurrentPlanInfoWithUpsellSection
                    subscription={subscription as Subscription}
                    app={app}
                    user={user}
                    serversCount={serversCount}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    vpnUpsells={vpnPlusFromFreeUpsells.upsells}
                    bundleUpsells={unlimitedBannerGradientUpsells.upsells}
                    handleExplorePlans={vpnPlusFromFreeUpsells.handleExplorePlans}
                    telemetryFlow={vpnPlusFromFreeUpsells.telemetryFlow}
                    userCanHave24MonthPlan={userCanHave24MonthPlan}
                />
            ),
        },
        {
            enabled:
                (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) &&
                subscription?.Cycle === CYCLE.YEARLY &&
                showAVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled:
                (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) &&
                subscription?.Cycle === CYCLE.YEARLY &&
                showBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    showProductCards={true}
                    showUpsellPanels={false}
                    showDiscoverButton={false}
                    showUpsellHeader={true}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled:
                (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) &&
                subscription?.Cycle === CYCLE.TWO_YEARS &&
                showAVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    showProductCards={true}
                    showUpsellPanels={false}
                    showDiscoverButton={false}
                    showUpsellHeader={true}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled:
                (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) &&
                subscription?.Cycle === CYCLE.TWO_YEARS &&
                showBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <>
                    <UnlimitedBannerGradient
                        showProductCards={true}
                        showUpsellPanels={false}
                        showDiscoverButton={false}
                        showUpsellHeader={true}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                    <DuoBanner app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && showAVariant,
            upsells: vpnPlusExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <VpnPlusExtendSubscription
                        subscription={subscription as Subscription}
                        {...vpnPlusExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && showBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <>
                    <UnlimitedBannerGradient
                        showProductCards={true}
                        showUpsellPanels={false}
                        showDiscoverButton={false}
                        showUpsellHeader={true}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                </>
            ),
        },
        {
            enabled: hasBundle(subscription) && subscription?.Cycle === CYCLE.MONTHLY,
            upsells: unlimitedBannerExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerExtendSubscription
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...unlimitedBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: hasBundle(subscription) && subscription?.Cycle !== CYCLE.MONTHLY,
            element: <ExploreGroupPlansBanner app={app} subscription={subscription as Subscription} />,
        },
        {
            enabled: hasDuo(subscription) && subscription?.Cycle === CYCLE.MONTHLY,
            upsells: duoBannerExtendSubscriptionUpsells.upsells,
            element: (
                <DuoBannerExtendSubscription
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...duoBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: hasDuo(subscription) && subscription?.Cycle !== CYCLE.MONTHLY,
            element: <FamilyBanner app={app} subscription={subscription as Subscription} />,
        },
        {
            enabled: hasFamily(subscription) && subscription?.Cycle === CYCLE.MONTHLY,
            upsells: familyBannerExtendSubscriptionUpsells.upsells,
            element: (
                <FamilyBannerExtendSubscription
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...familyBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: showBVariant && hasFamily(subscription) && subscription?.Cycle !== CYCLE.MONTHLY,
            element: <VPNB2BBanner app={app} />,
        },
    ];

    const [loading, withLoading] = useLoading(true);
    const payments = usePaymentsPreloaded();

    const upsellSection = upsellSections.find((upsell) => upsell.enabled) ?? null;
    const key = upsellSection?.upsells?.map((upsell) => upsell.planKey).join('-') ?? '';
    useEffect(() => {
        if (!payments.hasEssentialData) {
            return;
        }

        const promises =
            upsellSection?.upsells?.map((upsell) => upsell?.initializeOfferPrice?.(payments)).filter(isTruthy) ?? [];

        withLoading(Promise.all(promises)).catch(noop);
    }, [key, payments.hasEssentialData]);

    if (!subscription) {
        return {
            upsellSection: null,
            loading: true,
        };
    }

    return {
        upsellSection: upsellSection?.element,
        loading,
    };
};

interface YourPlanSectionV2Props {
    app: APP_NAMES;
}

const YourPlanUpsellsSectionV2Inner = ({ app }: YourPlanSectionV2Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const variant = useVariant('VPNDashboard');

    useLoad();

    const { upsellSection, loading: upsellLoading } = useUpsellSection({
        app,
        subscription,
        user,
        serversCount,
        freePlan,
        plansMap,
        variant,
    });

    const loading = loadingSubscription || loadingPlans || serversCountLoading || plansMapLoading || upsellLoading;

    if (!subscription || !plans || loading) {
        return <Loader />;
    }

    return upsellSection;
};

export const YourPlanUpsellsSectionV2 = (props: YourPlanSectionV2Props) => {
    return (
        <PaymentsContextProvider>
            <YourPlanUpsellsSectionV2Inner {...props} />
        </PaymentsContextProvider>
    );
};

export default YourPlanUpsellsSectionV2;
