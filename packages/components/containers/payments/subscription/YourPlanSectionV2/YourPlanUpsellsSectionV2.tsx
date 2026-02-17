import { useEffect } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useLoad from '@proton/components/hooks/useLoad';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import type { TelemetryPaymentFlow } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import useLoading from '@proton/hooks/useLoading';
import type { FreeSubscription, FullPlansMap } from '@proton/payments';
import {
    CYCLE,
    FREE_PLAN,
    type FreePlanDefault,
    PLANS,
    type Subscription,
    getCanAccessFamilyPlans,
    getHasConsumerVpnPlan,
    hasAllProductsB2CPlan,
    hasBundle,
    hasDeprecatedVPN,
    hasDrive,
    hasDrive1TB,
    hasDuo,
    hasFamily,
    hasFreeOrPlus,
    hasLumo,
    hasMail,
    hasPass,
    hasPassFamily,
    hasVPN2024,
    hasVPNPassBundle,
    hasVisionary,
} from '@proton/payments';
import { isExFamilyTrial } from '@proton/payments/core/subscription/helpers';
import { PaymentsContextProvider, isPaymentsPreloaded } from '@proton/payments/ui';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import useVariant from '@proton/unleash/useVariant';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { type Upsell, isUpsellWithPlan } from '../helpers';
import CurrentPlanInfoWithUpsellSection from './Upsells/CurrentPlanInfoSection';
import DuoBanner from './Upsells/DuoBanner';
import DuoBannerExtendSubscription, { useDuoBannerExtendSubscription } from './Upsells/DuoBannerExtendSubscription';
import ExploreGroupPlansBanner from './Upsells/ExploreGroupPlansBanner';
import FamilyBanner from './Upsells/FamilyBanner';
import FamilyBannerExtendSubscription, {
    useFamilyBannerExtendSubscription,
} from './Upsells/FamilyBannerExtendSubscription';
import FamilyUpgradeBanner from './Upsells/FamilyUpgradeBanner';
import PBSB2BBanner from './Upsells/PBSB2BBanner';
import UnlimitedBannerExtendSubscription, {
    useUnlimitedBannerExtendSubscription,
} from './Upsells/UnlimitedBannerExtendSubscription';
import UnlimitedBannerGradient, { useUnlimitedBannerGradientUpsells } from './Upsells/UnlimitedBannerGradient';
import UnlimitedBannerPlain from './Upsells/UnlimitedBannerPlain';
import VPNB2BBanner from './Upsells/VPNB2BBanner';
import VisionaryExtendSubscription, { useVisionaryExtendSubscription } from './Upsells/VisionaryExtendSubscription';
import VpnPlusExtendSubscription, { useVpnPlusExtendSubscription } from './Upsells/VpnPlusExtendSubscription';
import VpnPlusFromFree, { useVpnPlusFromFreeUpsells } from './Upsells/VpnPlusFromFree';
import DrivePlusExtendSubscription, {
    useDrivePlusExtendSubscription,
} from './Upsells/drive/DrivePlusExtendSubscription';
import DrivePlusFromFreeBanner from './Upsells/drive/DrivePlusFromFreeBanner';
import { useSubscriptionPriceComparison } from './Upsells/helper';
import MailPlusExtendSubscription, { useMailPlusExtendSubscription } from './Upsells/mail/MailPlusExtendSubscription';
import MailPlusFromFree, { useMailPlusFromFreeUpsells } from './Upsells/mail/MailPlusFromFree';
import MeetProfessionalFromFree, { useMeetProfessionalFromFreeUpsells } from './Upsells/meet/MeetProfessionalFromFree';
import WorkspaceBanner from './Upsells/meet/WorkspaceBanner';
import PassFamilyBannerExtendSubscription, {
    usePassFamilyBannerExtendSubscription,
} from './Upsells/pass/PassFamilyBannerExtendSubscription';
import PassPlusExtendSubscription, { usePassPlusExtendSubscription } from './Upsells/pass/PassPlusExtendSubscription';
import PassPlusFromFree, { usePassPlusFromFreeUpsells } from './Upsells/pass/PassPlusFromFree';

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

    const vpnVariant = useVariant('VPNDashboard');

    const showVPNAVariant = vpnVariant.name === 'A';
    const showVPNBVariant = vpnVariant.name === 'B';

    // TODO: Review if these checks are required as upsell config will do the app check
    const hasMailFree = isFree && (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR);
    const hasDriveFree = isFree && app === APPS.PROTONDRIVE;
    const hasPassFree = isFree && app === APPS.PROTONPASS && !user.hasPassLifetime;
    const hasVPNFree = isFree && app === APPS.PROTONVPN_SETTINGS;
    const hasMeetFree = isFree && app === APPS.PROTONMEET;
    const hasLumoPlus = hasLumo(subscription);

    // For users on Ex-Family Unlimited trial, show Unlimited 1m + 12m upsell
    const exFamilyTrial = isExFamilyTrial(subscription);

    // We want to show the VPN upsells to users with Lumo plan since they migrate from the Lumo plan to having a Lumo addon
    const isFreeUser = hasMailFree || hasDriveFree || hasPassFree || hasVPNFree || hasLumoPlus || hasMeetFree;

    // Allow 24-month plan for VPN app and VPN plans. Update the condition based on requirements
    const userCanHave24MonthPlan = app === APPS.PROTONVPN_SETTINGS || getHasConsumerVpnPlan(subscription);

    const upsellParams = {
        subscription,
        serversCount,
        app,
        plansMap,
        freePlan,
        show24MonthPlan: userCanHave24MonthPlan,
        user,
    };

    const mailPlusFromFreeUpsells = useMailPlusFromFreeUpsells(upsellParams);
    const vpnPlusFromFreeUpsells = useVpnPlusFromFreeUpsells(upsellParams);
    const meetProfessionalFromFreeUpsells = useMeetProfessionalFromFreeUpsells(upsellParams);
    const unlimitedBannerGradientUpsells = useUnlimitedBannerGradientUpsells(upsellParams);
    const vpnPlusExtendSubscriptionUpsells = useVpnPlusExtendSubscription(upsellParams);
    const mailPlusExtendSubscriptionUpsells = useMailPlusExtendSubscription(upsellParams);
    const drivePlusExtendSubscriptionUpsells = useDrivePlusExtendSubscription({
        ...upsellParams,
        planToUpsell: PLANS.DRIVE,
    });
    const drivePlusOneTBExtendSubscriptionUpsells = useDrivePlusExtendSubscription({
        ...upsellParams,
        planToUpsell: PLANS.DRIVE_1TB,
    });
    const unlimitedBannerExtendSubscriptionUpsells = useUnlimitedBannerExtendSubscription(upsellParams);
    const duoBannerExtendSubscriptionUpsells = useDuoBannerExtendSubscription(upsellParams);
    const familyBannerExtendSubscriptionUpsells = useFamilyBannerExtendSubscription(upsellParams);
    const passPlusFromFreeUpsells = usePassPlusFromFreeUpsells(upsellParams);
    const passPlusExtendSubscriptionUpsells = usePassPlusExtendSubscription(upsellParams);
    const passFamilyBannerExtendSubscriptionUpsells = usePassFamilyBannerExtendSubscription(upsellParams);
    const visionaryExtendSubscriptionUpsells = useVisionaryExtendSubscription(upsellParams);

    const unlimitedPlanMaxSpace = humanSize({
        bytes: plansMap[PLANS.BUNDLE]?.MaxSpace ?? 536870912000,
        unit: 'GB',
        fraction: 0,
    });

    // Check if the user can save money by switching to annual cycle. If not, do not show annual cycle upsell
    const { showSavings } = useSubscriptionPriceComparison(app, subscription);
    const canSaveByExtendingPlan = subscription?.Cycle === CYCLE.MONTHLY && showSavings;

    const upsellSections = [
        {
            enabled: isFreeUser && app === APPS.PROTONVPN_SETTINGS && showVPNAVariant,
            upsells: [...vpnPlusFromFreeUpsells.upsells, ...unlimitedBannerGradientUpsells.upsells],
            element: (
                <>
                    <VpnPlusFromFree subscription={subscription as Subscription} {...vpnPlusFromFreeUpsells} />
                    <UnlimitedBannerGradient
                        app={app}
                        showProductCards={false}
                        showUpsellPanels={false}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                </>
            ),
        },
        {
            enabled: isFreeUser && app === APPS.PROTONVPN_SETTINGS && showVPNBVariant,
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
                showVPNAVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
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
                showVPNBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
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
                showVPNAVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
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
                showVPNBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <>
                    <UnlimitedBannerGradient
                        app={app}
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
            enabled: (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && showVPNAVariant,
            upsells: vpnPlusExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <VpnPlusExtendSubscription
                        app={app}
                        subscription={subscription as Subscription}
                        {...vpnPlusExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: (hasDeprecatedVPN(subscription) || hasVPN2024(subscription)) && showVPNBVariant,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <>
                    <UnlimitedBannerGradient
                        app={app}
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
            enabled: exFamilyTrial,
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled: isFreeUser && (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR),
            upsells: [...mailPlusFromFreeUpsells.upsells, ...unlimitedBannerGradientUpsells.upsells],
            element: (
                <>
                    <MailPlusFromFree subscription={subscription as Subscription} {...mailPlusFromFreeUpsells} />
                    <UnlimitedBannerGradient
                        app={app}
                        showProductCards={false}
                        showUpsellPanels={false}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                </>
            ),
        },
        {
            enabled: hasMail(subscription) && canSaveByExtendingPlan,
            upsells: mailPlusExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <MailPlusExtendSubscription
                        app={app}
                        subscription={subscription as Subscription}
                        {...mailPlusExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: hasMail(subscription),
            upsells: mailPlusExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled: isFreeUser && app === APPS.PROTONPASS,
            upsells: [...passPlusFromFreeUpsells.upsells, ...unlimitedBannerGradientUpsells.upsells],
            element: (
                <>
                    <PassPlusFromFree subscription={subscription as Subscription} {...passPlusFromFreeUpsells} />
                    <UnlimitedBannerGradient
                        app={app}
                        showProductCards={false}
                        showUpsellPanels={false}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                </>
            ),
        },
        {
            enabled: hasPass(subscription) && canSaveByExtendingPlan,
            upsells: passPlusExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <PassPlusExtendSubscription
                        app={app}
                        subscription={subscription as Subscription}
                        {...passPlusExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: hasPass(subscription),
            upsells: passPlusExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled: hasPassFamily(subscription) && canSaveByExtendingPlan,
            upsells: passFamilyBannerExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <PassFamilyBannerExtendSubscription
                        app={app}
                        subscription={subscription as Subscription}
                        showUpsellPanels={true}
                        {...passFamilyBannerExtendSubscriptionUpsells}
                    />
                    <FamilyUpgradeBanner app={app} subscription={subscription as Subscription} />,
                </>
            ),
        },
        {
            enabled: hasPassFamily(subscription),
            upsells: passFamilyBannerExtendSubscriptionUpsells.upsells,
            element: <FamilyUpgradeBanner app={app} subscription={subscription as Subscription} />,
        },
        {
            enabled: isFreeUser && app === APPS.PROTONDRIVE,
            upsells: [...unlimitedBannerGradientUpsells.upsells],
            element: (
                <>
                    <UnlimitedBannerGradient
                        app={app}
                        showProductCards={true}
                        showUpsellPanels={true}
                        gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                        gridSectionSubTitleCopy={c('Plan description')
                            .t`Privacy suite with premium services and ${unlimitedPlanMaxSpace} of encrypted cloud storage, all in one bundle.`}
                        subscription={subscription as Subscription}
                        {...unlimitedBannerGradientUpsells}
                    />
                    <DrivePlusFromFreeBanner app={app} />
                </>
            ),
        },
        {
            enabled: hasDrive(subscription) && canSaveByExtendingPlan,
            upsells: drivePlusExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <DrivePlusExtendSubscription
                        app={app}
                        planToUpsell={PLANS.DRIVE}
                        subscription={subscription as Subscription}
                        {...drivePlusExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: hasDrive(subscription),
            upsells: drivePlusExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled: hasDrive1TB(subscription) && canSaveByExtendingPlan,
            upsells: drivePlusOneTBExtendSubscriptionUpsells.upsells,
            element: (
                <>
                    <DrivePlusExtendSubscription
                        app={app}
                        planToUpsell={PLANS.DRIVE_1TB}
                        subscription={subscription as Subscription}
                        {...drivePlusOneTBExtendSubscriptionUpsells}
                    />
                    <UnlimitedBannerPlain app={app} subscription={subscription as Subscription} />
                </>
            ),
        },
        {
            enabled: hasDrive1TB(subscription),
            upsells: drivePlusOneTBExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        {
            enabled: isFreeUser && app === APPS.PROTONMEET,
            upsells: meetProfessionalFromFreeUpsells.upsells,
            element: (
                <>
                    <MeetProfessionalFromFree
                        subscription={subscription as Subscription}
                        {...meetProfessionalFromFreeUpsells}
                    />
                    <WorkspaceBanner app={app} />
                </>
            ),
        },
        {
            enabled:
                !isFreeUser &&
                (hasFreeOrPlus(subscription) || hasAllProductsB2CPlan(subscription)) &&
                app === APPS.PROTONMEET,
            upsells: meetProfessionalFromFreeUpsells.upsells,
            element: (
                <>
                    <WorkspaceBanner app={app} />
                </>
            ),
        },
        {
            enabled: hasBundle(subscription) && canSaveByExtendingPlan,
            upsells: unlimitedBannerExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerExtendSubscription
                    app={app}
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...unlimitedBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: hasBundle(subscription) && getCanAccessFamilyPlans(subscription),
            element: <ExploreGroupPlansBanner app={app} subscription={subscription as Subscription} />,
        },
        {
            enabled: hasDuo(subscription) && canSaveByExtendingPlan,
            upsells: duoBannerExtendSubscriptionUpsells.upsells,
            element: (
                <DuoBannerExtendSubscription
                    app={app}
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...duoBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: hasDuo(subscription) && getCanAccessFamilyPlans(subscription),
            element: <FamilyBanner app={app} subscription={subscription as Subscription} />,
        },
        {
            enabled: hasFamily(subscription) && canSaveByExtendingPlan,
            upsells: familyBannerExtendSubscriptionUpsells.upsells,
            element: (
                <FamilyBannerExtendSubscription
                    app={app}
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...familyBannerExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled:
                showVPNBVariant &&
                hasFamily(subscription) &&
                subscription?.Cycle !== CYCLE.MONTHLY &&
                app === APPS.PROTONVPN_SETTINGS,
            element: <VPNB2BBanner app={app} />,
        },
        {
            enabled: hasVisionary(subscription) && canSaveByExtendingPlan,
            upsells: visionaryExtendSubscriptionUpsells.upsells,
            element: (
                <VisionaryExtendSubscription
                    app={app}
                    subscription={subscription as Subscription}
                    showUpsellPanels={true}
                    {...visionaryExtendSubscriptionUpsells}
                />
            ),
        },
        {
            enabled: app !== APPS.PROTONVPN_SETTINGS && (hasFamily(subscription) || hasVisionary(subscription)),
            element: <PBSB2BBanner app={app} />,
        },
        {
            enabled: hasVPNPassBundle(subscription),
            upsells: unlimitedBannerGradientUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
        // This has to remain the last option as users with plan could also have pass lifetime
        // Moving it above will result in incorrect upsell shown to the user.
        {
            enabled: hasPassLifetime(user),
            upsells: passPlusExtendSubscriptionUpsells.upsells,
            element: (
                <UnlimitedBannerGradient
                    app={app}
                    showProductCards={true}
                    showUpsellPanels={true}
                    gridSectionHeaderCopy={c('Title').t`Get complete privacy coverage`}
                    subscription={subscription as Subscription}
                    {...unlimitedBannerGradientUpsells}
                />
            ),
        },
    ];

    const [loading, withLoading] = useLoading(true);
    const payments = usePayments();

    const upsellSection = upsellSections.find((upsell) => upsell.enabled) ?? null;
    const key = upsellSection?.upsells?.map((upsell) => upsell.planKey).join('-') ?? '';
    useEffect(() => {
        if (!isPaymentsPreloaded(payments)) {
            return;
        }

        const promises =
            upsellSection?.upsells
                ?.filter(isUpsellWithPlan)
                .map((upsell) => upsell.initializeOfferPrice?.(payments))
                .filter(isTruthy) ?? [];

        withLoading(Promise.all(promises)).catch(noop);
    }, [key, payments.initialized]);

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
