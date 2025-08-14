import { c } from 'ttag';

import { Button, DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcChevronRight } from '@proton/icons';
import { CYCLE, PLANS, PLAN_NAMES, type Subscription } from '@proton/payments';
import { getHasConsumerVpnPlan } from '@proton/payments';
import { DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSelectFromNCountries, getVpnServers } from '@proton/shared/lib/vpn/features';
import isTruthy from '@proton/utils/isTruthy';

import type { PlanCardFeatureDefinition } from '../../../features/interface';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { GetPlanUpsellArgs, MaybeUpsell } from '../../helpers';
import { defaultUpsellCycleB2C, getUpsell } from '../../helpers';
import UpsellPanelsV2 from '../../panels/UpsellPanelsV2';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionProps, UpsellsHook } from '../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../helpers';
import countriesIcon from '../icons/countries.svg';
import doubleIcon from '../icons/double.svg';
import lightningIcon from '../icons/lightning.svg';
import serverIcon from '../icons/server.svg';
import shieldIcon from '../icons/shield.svg';
import streamingIcon from '../icons/streaming.svg';
import UpsellMultiBox from './UpsellMultiBox';

export const getVPNFeatures = (vpnServers: VPNServersCountData): PlanCardFeatureDefinition[] => {
    return [
        {
            text: getSelectFromNCountries(vpnServers.paid.countries),
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
            text: getVpnServers(vpnServers.paid.servers),
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

const getVPNUpsell = ({ app, plansMap, openSubscriptionModal, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    const plan = PLANS.VPN2024;

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

export const useVpnPlusFromFreeUpsells = ({
    show24MonthPlan,
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
        getVPNUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getVPNUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: !show24MonthPlan,
        }),
        show24MonthPlan &&
            getVPNUpsell({
                ...upsellsPayload,
                customCycle: CYCLE.TWO_YEARS,
                highlightPrice: true,
                title: getDashboardUpsellTitle(CYCLE.TWO_YEARS),
                isRecommended: true,
            }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, serversCount, telemetryFlow, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
}

const VpnPlusFromFree = ({ subscription, serversCount, upsells, handleExplorePlans }: Props) => {
    const plan = PLANS.VPN2024;

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Upgrade your privacy`}
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
                        <ul className="unstyled grid lg:grid-cols-4 gap-4 m-0">
                            {getVPNFeatures(serversCount).map(({ text, tooltip, highResIcon }, index) => {
                                const key = typeof text === 'string' ? text : index;
                                return (
                                    <li key={key} className="flex items-center">
                                        {highResIcon && <img src={highResIcon} alt="" className="shrink-0 mr-2" />}
                                        {text}
                                        {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                }
                upsellGradient="vpn"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default VpnPlusFromFree;
