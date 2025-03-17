import { c } from 'ttag';

import { Button, DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcChevronRight } from '@proton/icons';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getHasConsumerVpnPlan } from '@proton/shared/lib/helpers/subscription';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { GetPlanUpsellArgs, MaybeUpsell } from '../../helpers';
import { defaultUpsellCycleB2C, getUpsell } from '../../helpers';
import UpsellPanelV2 from '../../panels/UpsellPanelV2';
import UpsellPanelsV2 from '../../panels/UpsellPanelsV2';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import PlanPriceElement from '../PlanPriceElement';
import type { UpsellSectionProps } from '../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../helpers';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

const getDuoUpsell = ({ plansMap, openSubscriptionModal, app, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    const plan = PLANS.DUO;

    return getUpsell({
        plan,
        plansMap,
        features: [],
        app,
        upsellPath: DASHBOARD_UPSELL_PATHS.VPN,
        title: rest.title,
        customCycle: rest.customCycle || defaultUpsellCycleB2C,
        description: '',
        onUpgrade: () =>
            openSubscriptionModal({
                cycle: rest.customCycle || defaultUpsellCycleB2C,
                plan,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: rest.telemetryFlow,
            }),
        ...rest,
    });
};

interface Props extends UpsellSectionProps {
    showUpsellPanels: boolean;
}

const DuoBannerExtendSubscription = ({
    showUpsellPanels = true,
    subscription,
    app,
    plansMap,
    serversCount,
    freePlan,
    user,
    show24MonthPlan,
    ...rest
}: Props) => {
    const { totalSavings, showSavings } = useSubscriptionPriceComparison(subscription);
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const plan = PLANS.DUO;
    const planName = PLAN_NAMES[plan];

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'plans' },
            defaultAudience: Audience.FAMILY,
            telemetryFlow,
        });
    };

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        serversCount,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
        ...rest,
    };

    const upsells = [
        getDuoUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: !show24MonthPlan,
            defaultCtaOverrides: { label: c('Action').t`Get the deal` },
        }),
        show24MonthPlan &&
            getDuoUpsell({
                ...upsellsPayload,
                customCycle: CYCLE.TWO_YEARS,
                highlightPrice: true,
                title: getDashboardUpsellTitle(CYCLE.TWO_YEARS),
                isRecommended: true,
                defaultCtaOverrides: { label: c('Action').t`Get the deal` },
            }),
    ].filter(isTruthy);

    const priceString = subscription && getSimplePriceString(subscription.Currency, totalSavings);

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Compare plans`}
                cta={
                    <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                        {c('Action').t`Compare all plans`}
                        <IcChevronRight className="shrink-0 ml-1" />
                    </Button>
                }
            />

            <UpsellMultiBox
                header={
                    <PlanIconName
                        logo={<PlanIcon planName={plan} />}
                        topLine={c('Plans').t`Enjoying ${planName}?`}
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
                    subscription &&
                    showUpsellPanels && (
                        <>
                            <div className="flex flex-column lg:flex-row gap-4 flex-nowrap">
                                <UpsellPanelV2 title={c('Headline').t`You currently pay`} features={[]}>
                                    <PlanPriceElement user={user} subscription={subscription} />
                                </UpsellPanelV2>
                                <UpsellPanelsV2 upsells={upsells} subscription={subscription} />
                            </div>
                        </>
                    )
                }
                upsellGradient="unlimited"
                style="card"
            />
        </DashboardGrid>
    );
};

export default DuoBannerExtendSubscription;
