import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/index';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { CYCLE, PLANS, PLAN_NAMES, type Subscription, getHasConsumerVpnPlan } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { GetPlanUpsellArgs } from '../../../helpers/dashboard-upsells';
import UpsellPanelV2 from '../../../panels/UpsellPanelV2';
import UpsellPanelsV2 from '../../../panels/UpsellPanelsV2';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import PlanPriceElement from '../../PlanPriceElement';
import type { UpsellSectionProps, UpsellsHook } from '../../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../../helpers';
import UpsellMultiBox from '../UpsellMultiBox';
import { getDashboardUpsellV2, useSubscriptionPriceComparison } from '../helper';

export const useMailPlusExtendSubscription = ({
    subscription,
    app,
    plansMap,
    serversCount,
    freePlan,
    user,
}: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
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
    };

    const upsells = [
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MAILPLUS,
            plan: PLANS.MAIL,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: true,
            defaultCtaOverrides: { label: c('Action').t`Get the deal` },
        }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, serversCount, telemetryFlow, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
    app: APP_NAMES;
}

const MailPlusExtendSubscription = ({ app, subscription, user, handleExplorePlans, upsells }: Props) => {
    const { totalSavings, showSavings } = useSubscriptionPriceComparison(app, subscription);

    const plan = PLANS.MAIL;
    const planName = PLAN_NAMES[plan];

    const priceString = getSimplePriceString(subscription.Currency, totalSavings);

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
                upsellGradient="unlimited"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default MailPlusExtendSubscription;
