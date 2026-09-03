import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { DARK_WEB_MONITORING_NAME, DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import Info from '../../../../../../components/link/Info';
import useDashboardPaymentFlow from '../../../../../../hooks/useDashboardPaymentFlow';
import type { PlanCardFeatureDefinition } from '../../../../features/interface';
import { useSubscriptionModal } from '../../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../constants';
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
            id: 'storage',
            text: c('Features').t`15 GB storage`,
            included: true,
            icon: IcStorage,
        },
        {
            id: 'desktop-app',
            text: c('Features').t`Desktop app`,
            included: true,
            icon: IcDesktop,
        },
        {
            id: 'dark-web-monitoring',
            text: DARK_WEB_MONITORING_NAME,
            included: true,
            icon: IcShield2Bolt,
        },
        {
            id: 'custom-domain',
            text: c('Features').t`Connect custom domain`,
            included: true,
            icon: IcGlobe,
        },
        {
            id: 'pm-me-address',
            text: c('Features').t`@pm.me address`,
            included: true,
            icon: IcAt,
        },
        {
            id: 'priority-support',
            text: c('Features').t`Priority support`,
            included: true,
            icon: IcLifeRing,
        },
        {
            id: 'more-premium-features',
            text: c('Features').t`and more premium features...`,
            included: true,
        },
    ];
};

export const useMailPlusFromFreeUpsells = ({ app, plansMap, freePlan, user }: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
    };

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            telemetryFlow,
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

    return { upsells, handleExplorePlans, telemetryFlow, plansMap, freePlan, user };
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
                        <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
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
                            {getMailFeatures().map(({ id, text, tooltip, icon: FeatureIcon }) => {
                                return (
                                    <li key={id} className="flex items-center flex-nowrap">
                                        {FeatureIcon && (
                                            <FeatureIcon size={6} className="shrink-0 mr-2 color-primary" />
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
