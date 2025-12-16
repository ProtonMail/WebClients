import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/index';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { CYCLE, PLANS, PLAN_NAMES, type Subscription, getHasConsumerVpnPlan } from '@proton/payments';
import { DARK_WEB_MONITORING_NAME, DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { GetPlanUpsellArgs } from '../../../helpers';
import UpsellPanelsV2 from '../../../panels/UpsellPanelsV2';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionProps, UpsellsHook } from '../../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../../helpers';
import UpsellMultiBox from '../UpsellMultiBox';
import { getDashboardUpsellV2 } from '../helper';

const getMailFeatures = (): PlanCardFeatureDefinition[] => {
    return [
        {
            text: c('Features').t`15 GB storage`,
            included: true,
            icon: 'storage',
        },
        {
            text: c('Features').t`Desktop app`,
            included: true,
            icon: 'desktop',
        },
        {
            text: DARK_WEB_MONITORING_NAME,
            included: true,
            icon: 'shield-2-bolt',
        },
        {
            text: c('Features').t`Connect custom domain`,
            included: true,
            icon: 'globe',
        },
        {
            text: c('Features').t`@pm.me address`,
            included: true,
            icon: 'at',
        },
        {
            text: c('Features').t`Priority support`,
            included: true,
            icon: 'life-ring',
        },
        {
            text: c('Features').t`and more premium features...`,
            included: true,
        },
    ];
};

export const useMailPlusFromFreeUpsells = ({
    app,
    subscription,
    plansMap,
    serversCount,
    freePlan,
    user,
}: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        serversCount,
        freePlan,
        openSubscriptionModal,
    };

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
        });
    };

    const upsells = [
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MAILPLUS,
            plan: PLANS.MAIL,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MAILPLUS,
            plan: PLANS.MAIL,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: true,
        }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, serversCount, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
}

const MailPlusFromFree = ({ subscription, upsells, handleExplorePlans }: Props) => {
    const plan = PLANS.MAIL;

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
                header={<PlanIconName logo={<PlanIcon planName={plan} />} topLine={PLAN_NAMES[plan]} />}
                upsellPanels={
                    <>
                        {subscription && upsells && (
                            <div className="flex flex-column lg:flex-row gap-4 flex-nowrap mb-4">
                                <UpsellPanelsV2 upsells={upsells} subscription={subscription} />
                            </div>
                        )}
                        <ul className="unstyled grid lg:grid-cols-3 xl:grid-cols-4 gap-4 m-0">
                            {getMailFeatures().map(({ text, tooltip, icon }, index) => {
                                const key = typeof text === 'string' ? text : index;
                                return (
                                    <li key={key} className="flex items-center flex-nowrap">
                                        {icon && (
                                            <Icon size={6} name={icon} alt="" className="shrink-0 mr-2 color-primary" />
                                        )}
                                        {text}
                                        {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                }
                upsellGradient="unlimited"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default MailPlusFromFree;
