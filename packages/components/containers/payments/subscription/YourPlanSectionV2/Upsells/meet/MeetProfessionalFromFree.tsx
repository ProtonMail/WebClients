import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    PAID_MAX_ACTIVE_MEETINGS,
    PAID_MAX_PARTICIPANTS,
    getMaxActiveMeetings,
    getMaxMeetingsPerDay,
    getMaxParticipants,
    getMeetBookingPages,
    getMeetMeetingRecording,
    getMeetingMaxLength,
} from '@proton/components/containers/payments/features/meet';
import type { GetPlanUpsellArgs } from '@proton/components/containers/payments/subscription/helpers';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/index';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { Subscription } from '@proton/payments';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getHasConsumerVpnPlan } from '@proton/payments/core/subscription/helpers';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import UpsellPanelsV2 from '../../../panels/UpsellPanelsV2';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionProps, UpsellsHook } from '../../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../../helpers';
import UpsellMultiBox from '../UpsellMultiBox';
import { getDashboardUpsellV2 } from '../helper';

const getMeetProfessionalFeatures = (): PlanCardFeatureDefinition[] => {
    return [
        getMeetingMaxLength('paid'),
        getMaxActiveMeetings(PAID_MAX_ACTIVE_MEETINGS),
        getMeetMeetingRecording(true),
        getMaxParticipants(PAID_MAX_PARTICIPANTS),
        getMaxMeetingsPerDay('unlimited'),
        getMeetBookingPages(true),
    ];
};

export const useMeetProfessionalFromFreeUpsells = ({
    app,
    subscription,
    plansMap,
    serversCount,
    freePlan,
    user,
}: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        serversCount,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
    };

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const upsells = [
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MEET,
            plan: PLANS.MEET_BUSINESS,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MEET,
            plan: PLANS.MEET_BUSINESS,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: true,
        }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, serversCount, telemetryFlow, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
}

const MeetProfessionalFromFree = ({ subscription, upsells, handleExplorePlans }: Props) => {
    const plan = PLANS.MEET_BUSINESS;

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
                        <div className="flex lg:flex-row flex-column gap-4 lg:items-center">
                            <ul className="unstyled grid lg:grid-cols-2 xl:grid-cols-3 gap-4 m-0 lg:flex-1">
                                {getMeetProfessionalFeatures().map(({ text, tooltip, icon, status }, index) => {
                                    const key = typeof text === 'string' ? text : index;
                                    return (
                                        <li key={key} className="flex items-center flex-nowrap">
                                            {icon && (
                                                <Icon
                                                    size={6}
                                                    name={icon}
                                                    alt=""
                                                    className="shrink-0 mr-2 color-primary"
                                                />
                                            )}
                                            <span>
                                                {text}
                                                {status === 'coming-soon' && (
                                                    <span className="color-weak"> ({c('Info').t`Coming soon`})</span>
                                                )}
                                            </span>
                                            {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div>{c('Features').t`and more premium features...`}</div>
                        </div>
                    </>
                }
                upsellGradient="unlimited"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default MeetProfessionalFromFree;
