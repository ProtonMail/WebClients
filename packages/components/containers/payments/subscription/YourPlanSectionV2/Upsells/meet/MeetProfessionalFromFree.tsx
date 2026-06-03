import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import CycleSelector from '@proton/components/containers/payments/CycleSelector';
import { getShortStorageFeatureB2B } from '@proton/components/containers/payments/features/drive';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getNDomainsFeature } from '@proton/components/containers/payments/features/mail';
import {
    PAID_MAX_PARTICIPANTS,
    PAID_PREMIUM_MAX_PARTICIPANTS,
    getMaxMeetingsPerDay,
    getMaxParticipants,
    getMeetAppsText,
    getMeetBookingPages,
    getMeetBuiltInChatText,
    getMeetMeetingRecording,
    getMeetScreenSharingText,
    getMeetingMaxLength,
    getVideoMeetingsFeature,
} from '@proton/components/containers/payments/features/meet';
import type { GetPlanUpsellArgs } from '@proton/components/containers/payments/subscription/helpers';
import {
    type Upsell,
    type UpsellFeature,
    getUpsell,
} from '@proton/components/containers/payments/subscription/helpers';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/index';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { Subscription } from '@proton/payments';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getHasConsumerVpnPlan } from '@proton/payments/core/subscription/helpers';
import { DASHBOARD_UPSELL_PATHS, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import UpsellPanelsV2 from '../../../panels/UpsellPanelsV2';
import { PlanIcon } from '../../PlanIcon';
import type { UpsellSectionProps, UpsellsHook } from '../../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../../helpers';
import UpsellMultiBox from '../UpsellMultiBox';
import { getDashboardUpsellV2 } from '../helper';

const getMeetProfessionalFeatures = (): PlanCardFeatureDefinition[] => {
    return [
        getMeetingMaxLength('paid'),
        getMaxParticipants(PAID_MAX_PARTICIPANTS),
        getMaxMeetingsPerDay('unlimited'),
        { text: getMeetAppsText(), icon: 'mobile', included: true },
        { text: getMeetScreenSharingText(), icon: 'arrow-up-from-square', included: true },
        { text: getMeetBuiltInChatText(), icon: 'speech-bubble', included: true },
        getMeetBookingPages(true),
        getMeetMeetingRecording(true),
    ];
};

const toUpsellFeature = ({ highlight: _h, status: _s, ...rest }: PlanCardFeatureDefinition): UpsellFeature => rest;

const getMeetBusinessUpsellFeatures = (): UpsellFeature[] => getMeetProfessionalFeatures().map(toUpsellFeature);

const getWorkspaceStandardUpsellFeatures = (maxSpace: number, maxDomains: number): UpsellFeature[] => [
    { text: c('meet_2025: Feature').t`Includes Meet Professional`, icon: 'video-camera', included: true },
    toUpsellFeature(getShortStorageFeatureB2B(maxSpace)),
    toUpsellFeature(getNDomainsFeature({ n: maxDomains, tooltip: false })),
    { text: c('meet_2025: Feature').t`Secure mail and calendar`, icon: 'envelope', included: true },
    { text: c('meet_2025: Feature').t`Cloud storage and file sharing`, icon: 'drive', included: true },
    {
        text: c('meet_2025: Feature').t`Document and spreadsheet editor`,
        icon: 'file-lines',
        included: true,
    },
    {
        text: c('meet_2025: Feature').t`VPN with ad-blocker and malware protection`,
        icon: 'shield',
        included: true,
    },
    {
        text: c('meet_2025: Feature').t`Password manager with team vaults`,
        icon: 'locks',
        included: true,
    },
];

const getWorkspacePremiumUpsellFeatures = (maxSpace: number, maxDomains: number): UpsellFeature[] => [
    { text: c('meet_2025: Feature').t`Includes Meet Professional`, icon: 'video-camera', included: true },
    toUpsellFeature(getShortStorageFeatureB2B(maxSpace)),
    toUpsellFeature(getNDomainsFeature({ n: maxDomains, tooltip: false })),
    {
        text: c('meet_2025: Feature').t`Private AI Chat (${LUMO_SHORT_APP_NAME})`,
        icon: 'speech-bubble',
        included: true,
    },
    getVideoMeetingsFeature(PAID_PREMIUM_MAX_PARTICIPANTS),
    { text: c('meet_2025: Feature').t`Email writing assistant`, icon: 'pen-sparks', included: true },
    { text: c('meet_2025: Feature').t`Data retention policies`, icon: 'lock', included: true },
];

export const useMeetProfessionalFromFreeUpsells = ({
    app,
    subscription,
    plansMap,
    freePlan,
    user,
}: UpsellSectionProps): UpsellsHook & {
    b2bMonthlyUpsells: Upsell[];
    b2bYearlyUpsells: Upsell[];
    loadingSubscriptionModal: boolean;
} => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
    };

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            telemetryFlow,
        });
    };

    const upsells = [
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MEET,
            plan: PLANS.MEET,
            icon: <PlanIcon planName={PLANS.MEET} />,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: PLAN_NAMES[PLANS.MEET],
            description: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.MEET,
            plan: PLANS.MEET,
            icon: <PlanIcon planName={PLANS.MEET} />,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            isRecommended: true,
            title: PLAN_NAMES[PLANS.MEET],
            description: getDashboardUpsellTitle(CYCLE.YEARLY),
        }),
    ].filter(isTruthy);

    const makeB2BUpsells = (cycle: CYCLE): Upsell[] => {
        const meetBizFeatures = getMeetBusinessUpsellFeatures();

        const bundleProMaxSpace = plansMap[PLANS.BUNDLE_PRO_2024]?.MaxSpace;
        const bundleProMaxDomains = plansMap[PLANS.BUNDLE_PRO_2024]?.MaxDomains;
        const bundleBizMaxSpace = plansMap[PLANS.BUNDLE_BIZ_2025]?.MaxSpace;
        const bundleBizMaxDomains = plansMap[PLANS.BUNDLE_BIZ_2025]?.MaxDomains;

        const b2bBase = {
            plansMap,
            freePlan,
            app,
            upsellPath: DASHBOARD_UPSELL_PATHS.MEET,
            customCycle: cycle,
            telemetryFlow,
        };

        return [
            getUpsell({
                ...b2bBase,
                plan: PLANS.MEET_BUSINESS,
                features: meetBizFeatures,
                description: '',
                highlightPrice: true,
                icon: <PlanIcon planName={PLANS.MEET_BUSINESS} />,
                gradientColor: 'transparent',
                onUpgrade: () =>
                    openSubscriptionModal({
                        cycle,
                        plan: PLANS.MEET_BUSINESS,
                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                        disablePlanSelection: true,
                        telemetryFlow,
                    }),
            }),
            getUpsell({
                ...b2bBase,
                plan: PLANS.BUNDLE_PRO_2024,
                features: getWorkspaceStandardUpsellFeatures(bundleProMaxSpace, bundleProMaxDomains),
                isRecommended: true,
                recommendedLabel: c('upsell panel').t`Recommended`,
                description: '',
                highlightPrice: true,
                icon: <PlanIcon planName={PLANS.BUNDLE_PRO_2024} />,
                gradientColor: 'rgb(1 225 183 / 0.15)',
                onUpgrade: () =>
                    openSubscriptionModal({
                        cycle,
                        plan: PLANS.BUNDLE_PRO_2024,
                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                        disablePlanSelection: true,
                        telemetryFlow,
                    }),
            }),
            getUpsell({
                ...b2bBase,
                plan: PLANS.BUNDLE_BIZ_2025,
                features: getWorkspacePremiumUpsellFeatures(bundleBizMaxSpace, bundleBizMaxDomains),
                description: '',
                highlightPrice: true,
                icon: <PlanIcon planName={PLANS.BUNDLE_BIZ_2025} />,
                gradientColor: 'rgb(109 74 255 / 0.15)',
                onUpgrade: () =>
                    openSubscriptionModal({
                        cycle,
                        plan: PLANS.BUNDLE_BIZ_2025,
                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                        disablePlanSelection: true,
                        telemetryFlow,
                    }),
            }),
        ].filter(isTruthy);
    };

    const b2bMonthlyUpsells = makeB2BUpsells(CYCLE.MONTHLY);
    const b2bYearlyUpsells = makeB2BUpsells(CYCLE.YEARLY);

    return {
        upsells,
        b2bMonthlyUpsells,
        b2bYearlyUpsells,
        loadingSubscriptionModal,
        handleExplorePlans,
        telemetryFlow,
        plansMap,
        freePlan,
        user,
    };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
    loadingSubscriptionModal: boolean;
    b2bMonthlyUpsells: Upsell[];
    b2bYearlyUpsells: Upsell[];
}

const MeetProfessionalFromFree = ({
    subscription,
    upsells,
    loadingSubscriptionModal,
    handleExplorePlans,
    b2bMonthlyUpsells,
    b2bYearlyUpsells,
}: Props) => {
    const [audienceTabIndex, setAudienceTabIndex] = useState(0);
    const [b2bCycle, setB2bCycle] = useState<CYCLE>(CYCLE.YEARLY);

    const b2bUpsells = b2bCycle === CYCLE.MONTHLY ? b2bMonthlyUpsells : b2bYearlyUpsells;

    const b2cContent = (
        <UpsellMultiBox
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
                                            <Icon size={6} name={icon} alt="" className="shrink-0 mr-2 color-primary" />
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
        />
    );

    const b2bContent = (
        <div className="flex flex-column gap-4 md:gap-6 p-4 md:p-6 pt-0 md:pt-0">
            <div className="UpsellMultiBox-gradient-unlimited p-4 rounded-xl">
                <div className="flex justify-end mb-4">
                    <CycleSelector
                        mode="buttons"
                        cycle={b2bCycle}
                        onSelect={(newCycle) => {
                            if (newCycle !== 'lifetime') {
                                setB2bCycle(newCycle);
                            }
                        }}
                        options={[
                            { text: c('Billing cycle option').t`1 month`, value: CYCLE.MONTHLY },
                            { text: c('Billing cycle option').t`12 months`, value: CYCLE.YEARLY },
                        ]}
                    />
                </div>
                <div className="flex flex-column lg:flex-row gap-4 flex-nowrap">
                    <UpsellPanelsV2 upsells={b2bUpsells} subscription={subscription} />
                </div>
            </div>
        </div>
    );

    const tabs = [
        { title: c('Tab').t`For personal use`, content: b2cContent },
        { title: c('Tab').t`For professional use`, content: b2bContent },
    ];

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Compare plans`}
                cta={
                    <Button color="norm" shape="ghost" onClick={handleExplorePlans} loading={loadingSubscriptionModal}>
                        {c('Action').t`Compare all plans`}
                        <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
                    </Button>
                }
            />

            <DashboardCard>
                <Tabs
                    value={audienceTabIndex}
                    onChange={setAudienceTabIndex}
                    tabs={tabs}
                    contained
                    navContainerClassName="px-4 md:px-6 pt-4 md:pt-6 flex justify-center"
                />
            </DashboardCard>
        </DashboardGrid>
    );
};

export default MeetProfessionalFromFree;
