import { c } from 'ttag';

import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import useApi from '@proton/components/hooks/useApi';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getHasConsumerVpnPlan } from '@proton/payments/core/subscription/helpers';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { getSelectFromNCountries, getVpnServers } from '@proton/shared/lib/vpn/features';
import isTruthy from '@proton/utils/isTruthy';
import { VPN_SERVERS } from '@proton/vpn/constants/vpnServers';

import type { PlanCardFeatureDefinition } from '../../../features/interface';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { GetPlanUpsellArgs, MaybeUpsell } from '../../helpers';
import { defaultUpsellCycleB2C, getUpsell } from '../../helpers';
import type { UpsellSectionProps, UpsellsHook } from '../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../helpers';
import countriesIcon from '../icons/countries.svg';
import doubleIcon from '../icons/double.svg';
import lightningIcon from '../icons/lightning.svg';
import serverIcon from '../icons/server.svg';
import shieldIcon from '../icons/shield.svg';
import streamingIcon from '../icons/streaming.svg';

export const getVPNFeatures = (): PlanCardFeatureDefinition[] => {
    return [
        {
            text: getSelectFromNCountries(VPN_SERVERS.paid.countries),
            included: true,
            highResIcon: countriesIcon,
        },
        {
            text: c('Features').t`Lightning-fast speeds`,
            included: true,
            highResIcon: lightningIcon,
        },
        {
            text: c('Features').t`NetShield Ad-blocker`,
            tooltip: c('Features: Tooltip').t`Protects you from ads, trackers, and malware on websites and apps`,
            included: true,
            highResIcon: shieldIcon,
        },
        {
            text: getVpnServers(VPN_SERVERS.paid.servers),
            included: true,
            highResIcon: serverIcon,
        },
        {
            text: c('Features').t`Secure streaming`,
            tooltip: c('Features: Tooltip')
                .t`Access content on streaming services including Netflix, Disney+, Prime Video, and more, from anywhere`,
            included: true,
            highResIcon: streamingIcon,
        },
        {
            text: c('Features').t`Double VPN`,
            tooltip: c('Features: Tooltip')
                .t`Secure Core servers route your traffic through 2 VPN servers for extra security`,
            included: true,
            highResIcon: doubleIcon,
        },
        {
            text: c('Features').t`and more premium features...`,
            included: true,
        },
    ];
};

const getVPNUpsell = ({
    app,
    plansMap,
    openSubscriptionModal,
    api,
    user,
    ...rest
}: GetPlanUpsellArgs & { api: Api; user: User }): MaybeUpsell => {
    const plan = PLANS.VPN2024;
    const cycle = rest.customCycle || defaultUpsellCycleB2C;

    return getUpsell({
        plan,
        plansMap,
        features: [],
        app,
        upsellPath: DASHBOARD_UPSELL_PATHS.VPN,
        title: rest.title,
        customCycle: cycle,
        description: '',
        onUpgrade: () => {
            return openSubscriptionModal({
                cycle,
                plan,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                telemetryFlow: rest.telemetryFlow,
                onMount: () => {
                    void sendTelemetryReport({
                        api,
                        delay: false,
                        event: TelemetryAccountDashboardEvents.upgradeButtonClick,
                        measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                        dimensions: {
                            app,
                            billing_cycle: cycle.toString(),
                            user_tier: getTelemetryUserTier(user),
                        },
                    });
                },
            });
        },
        ...rest,
    });
};

export const useVpnPlusFromFreeUpsells = ({
    show24MonthPlan,
    app,
    subscription,
    plansMap,
    freePlan,
    user,
}: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const api = useApi();

    const upsellsPayload: GetPlanUpsellArgs & { api: Api; user: User } = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
        api,
        user,
    };

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            telemetryFlow,
            onMount: () => {
                void sendTelemetryReport({
                    api,
                    delay: false,
                    event: TelemetryAccountDashboardEvents.upsellCtaClick,
                    measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                    dimensions: {
                        app,
                        cta: 'compare_plans',
                        user_tier: getTelemetryUserTier(user),
                    },
                });
            },
        });
    };

    const upsells = [
        getVPNUpsell({
            ...upsellsPayload,
            api,
            user,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getVPNUpsell({
            ...upsellsPayload,
            api,
            user,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: !show24MonthPlan,
        }),
        show24MonthPlan &&
            getVPNUpsell({
                ...upsellsPayload,
                api,
                user,
                customCycle: CYCLE.TWO_YEARS,
                highlightPrice: true,
                title: getDashboardUpsellTitle(CYCLE.TWO_YEARS),
                isRecommended: true,
            }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, telemetryFlow, plansMap, freePlan, user };
};
