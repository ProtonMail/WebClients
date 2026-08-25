import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getAddonsFromIDs } from '@proton/payments/core/planIDs';
import { getPlanIDs } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api, User } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getSimplePriceString } from '../../../../../components/price/helper';
import getBoldFormattedText from '../../../../../helpers/getBoldFormattedText';
import { getTelemetryUserTier } from '../../../../../helpers/getTelemetryUserTier';
import useDashboardPaymentFlow from '../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModalRaw } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { GetPlanUpsellArgs, MaybeUpsell } from '../../helpers';
import { defaultUpsellCycleB2C, getUpsell } from '../../helpers';
import UpsellPanelV2 from '../../panels/UpsellPanelV2';
import UpsellPanelsV2 from '../../panels/UpsellPanelsV2';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import PlanPriceElement from '../PlanPriceElement';
import type { UpsellSectionProps, UpsellsHook } from '../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../helpers';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

const getVPNUpsell = ({
    plansMap,
    openSubscriptionModal,
    app,
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
        onUpgrade: () =>
            openSubscriptionModal({
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
            }),
        ...rest,
    });
};

export const useVpnPlusExtendSubscription = ({
    subscription,
    app,
    plansMap,
    freePlan,
    user,
    show24MonthPlan,
}: UpsellSectionProps): UpsellsHook => {
    const openSubscriptionModal = useSubscriptionModalRaw();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const api = useApi();

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
                        cta: 'discover_unlimited_upgrade_section',
                        user_tier: getTelemetryUserTier(user),
                    },
                });
            },
        });
    };

    const upsellsPayload: GetPlanUpsellArgs & { api: Api; user: User } = {
        app,
        plansMap,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
        api,
        user,
    };

    const upsells = [
        getVPNUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: !show24MonthPlan,
            defaultCtaOverrides: { label: c('Action').t`Get the deal` },
            addons: getAddonsFromIDs(getPlanIDs(subscription)),
        }),
        show24MonthPlan &&
            getVPNUpsell({
                ...upsellsPayload,
                customCycle: CYCLE.TWO_YEARS,
                highlightPrice: true,
                title: getDashboardUpsellTitle(CYCLE.TWO_YEARS),
                isRecommended: true,
                defaultCtaOverrides: { label: c('Action').t`Get the deal` },
                addons: getAddonsFromIDs(getPlanIDs(subscription)),
            }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, telemetryFlow, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
    app: APP_NAMES;
}

const VpnPlusExtendSubscription = ({ app, subscription, user, handleExplorePlans, upsells }: Props) => {
    const { totalSavings, showSavings } = useSubscriptionPriceComparison(app, subscription);

    const plan = PLANS.VPN2024;
    const planName = PLAN_NAMES[plan];

    const priceString = getSimplePriceString(subscription.Currency, totalSavings);

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Upgrade your privacy`}
                cta={
                    <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                        {c('Action').t`Compare all plans`}
                        <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
                    </Button>
                }
            />

            <UpsellMultiBox
                style="card"
                header={
                    <PlanIconName
                        logo={<PlanIcon planName={plan} />}
                        topLine={c('Headline').t`Enjoying ${planName}?`}
                        bottomLine={
                            showSavings
                                ? getBoldFormattedText(
                                      c('Upsell')
                                          .t`**Save up to ${priceString}** with a longer subscription. Same premium features, lower price.`,
                                      'color-primary'
                                  )
                                : undefined
                        }
                    />
                }
                upsellPanels={
                    subscription && (
                        <>
                            <div className="flex flex-column lg:flex-row gap-4 flex-nowrap mb-4">
                                <UpsellPanelV2 title={c('Headline').t`You currently pay`} features={[]}>
                                    <PlanPriceElement user={user} subscription={subscription} />
                                </UpsellPanelV2>
                                <UpsellPanelsV2 upsells={upsells} subscription={subscription} />
                            </div>
                        </>
                    )
                }
                upsellGradient="vpn"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default VpnPlusExtendSubscription;
