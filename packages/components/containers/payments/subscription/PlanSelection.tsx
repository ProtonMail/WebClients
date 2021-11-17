import { ReactNode } from 'react';
import { c } from 'ttag';
import {
    Currency,
    Cycle,
    Organization,
    Plan,
    PlanIDs,
    Subscription,
    VPNCountries,
    VPNServers,
} from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { APPS, CYCLE, PLAN_SERVICES, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { FREE_MAIL_PLAN, FREE_VPN_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getBasicServers, getFreeServers, getPlusServers, getVpnConnections } from '@proton/shared/lib/vpn/features';
import { Button, Info } from '../../../components';

import CurrencySelector from '../CurrencySelector';
import CycleSelector from '../CycleSelector';

import PlanCard from './PlanCard';

import './PlanSelection.scss';
import PlanSelectionComparison from './PlanSelectionComparison';
import { useVPNServersCount } from '../../../hooks';

const NAMES = {
    free_mail: 'Free',
    free_vpn: 'Free',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
} as const;

const mailAppName = getAppName(APPS.PROTONMAIL);
const driveAppName = getAppName(APPS.PROTONDRIVE);
const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

export const getPlanInfo = (isVpn: boolean): { [key in keyof typeof NAMES]: string } => {
    return {
        free_mail: c('Info').t`For getting started with private and secure emailing.`,
        free_vpn: c('Info').t`A free and uncensored Internet should be available to all.`,
        [PLANS.VPNBASIC]: c('Info').t`Starter VPN service with P2P support.`,
        [PLANS.VPNPLUS]: c('Info').t`Full-featured VPN with speed up to 10 Gbps.`,
        [PLANS.PLUS]: c('Info').t`For individuals that need a fully-featured mailbox with advanced protection.`,
        [PLANS.PROFESSIONAL]: c('Info').t`For professionals that need secure business communications.`,
        [PLANS.VISIONARY]: isVpn
            ? c('Info').t`VPN + ${mailAppName} bundle for families and small businesses.`
            : c('Info').t`For families and small teams; includes both Mail and VPN.`,
    };
};

export interface PlanFeature {
    content: ReactNode;
    info?: ReactNode;
    notIncluded?: boolean;
}

export const getPlanFeatures = (
    plan: Plan,
    service: PLAN_SERVICES,
    vpnCountries: VPNCountries,
    serversCount: VPNServers
): PlanFeature[] => {
    const netflix = <b key={1}>{c('Netflix').t`Netflix`}</b>;
    const disney = <b key={2}>{c('Disney').t`Disney+`}</b>;
    const primeVideo = <b key={3}>{c('Prime Video').t`Prime Video`}</b>;
    const many = <b key={4}>{c('Many Others').t`and many others`}</b>;

    const freeCountries = vpnCountries.free_vpn.count;
    const basicCountries = vpnCountries[PLANS.VPNBASIC].count;

    const plusCountries = vpnCountries[PLANS.VPNPLUS].count;

    const { Name } = plan;
    // TODO: Improve the free plan logic.
    const planName = Name as keyof typeof NAMES;

    const adBlocker = {
        content: c('Plan feature').t`Built-in Adblocker (NetShield)`,
        info: (
            <Info
                title={c('Tooltip')
                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                url=" https://protonvpn.com/support/netshield/"
            />
        ),
    };

    const secureCore = {
        content: c('Plan feature').t`Secure Core servers`,
        info: (
            <Info
                title={c('Tooltip')
                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                url="https://protonvpn.com/support/secure-core-vpn/"
            />
        ),
    };

    const streamingService = {
        content: c('Plan feature').t`Streaming service support`,
        info: (
            <Info
                title={c('Info')
                    .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                url="https://protonvpn.com/support/streaming-guide/"
            />
        ),
    };

    const accessBlocked = {
        content: c('Plan feature').t`Access blocked content`,
        info: (
            <Info
                title={c('Info')
                    .jt`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
            />
        ),
    };

    const vpnConnections = { content: getVpnConnections(plan.MaxVPN) };

    if (planName === 'free_vpn') {
        return [
            { content: getFreeServers(serversCount.free_vpn, freeCountries) },
            vpnConnections,
            { content: c('Plan feature').t`Medium speed` },
            accessBlocked,
        ];
    }

    if (planName === PLANS.VPNBASIC) {
        return [
            { content: getBasicServers(serversCount[PLANS.VPNBASIC], basicCountries) },
            vpnConnections,
            { content: c('Plan feature').t`High speed` },
            accessBlocked,
            adBlocker,
        ];
    }

    if (planName === PLANS.VPNPLUS) {
        return [
            { content: getPlusServers(serversCount[PLANS.VPNPLUS], plusCountries) },
            vpnConnections,
            { content: c('Plan feature').t`Highest speed (up to 10 Gbps)` },
            streamingService,
            adBlocker,
            secureCore,
        ];
    }

    if (planName === PLANS.VISIONARY && service === PLAN_SERVICES.VPN) {
        return [
            { content: c('Plan feature').t`All ${PLAN_NAMES[PLANS.VPNPLUS]} plan features` },
            { content: c('Plan feature').t`Includes 6 user accounts` },
            {
                content: c('Plan feature').t`Includes Proton Visionary`,
                info: (
                    <Info
                        title={c('Tooltip')
                            .t`Get access to all the paid features for both ${vpnAppName} and ${mailAppName} (the encrypted email service that millions use to protect their data) with one plan.`}
                        url="https://protonmail.com"
                    />
                ),
            },
            { content: c('Plan feature').t`Early access to new products` },
        ];
    }

    const customEmail = {
        content: c('Plan feature').t`Custom email addresses`,
        info: (
            <Info
                title={c('Tooltip')
                    .t`Host emails for your own domain(s) at ${mailAppName}, e.g. john.smith@example.com`}
            />
        ),
    };

    const accessProtonDrive = {
        // translator: Access to <ProtonDrive> (beta)
        content: c('Plan feature').t`Access to ${driveAppName} (beta)`,
    };

    if (planName === 'free_mail') {
        return [
            { content: c('Plan feature').t`1 user` },
            { content: c('Plan feature').t`0.5 GB storage` },
            { content: c('Plan feature').t`1 address` },
            { content: c('Plan feature').t`3 folders / labels` },
            { ...customEmail, notIncluded: true },
            { ...accessProtonDrive, notIncluded: true },
        ];
    }

    const multipleInfo = (
        <Info
            title={c('Tooltip')
                .t`Create multiple email addresses linked to your account, e.g. username2@protonmail.com`}
        />
    );

    if (planName === PLANS.PLUS) {
        return [
            { content: c('Plan feature').t`1 user` },
            { content: c('Plan feature').t`5 GB storage *` },
            {
                content: c('Plan feature').t`5 addresses`,
                info: multipleInfo,
            },
            { content: c('Plan feature').t`200 folders / labels` },
            customEmail,
            accessProtonDrive,
        ];
    }

    if (planName === PLANS.PROFESSIONAL) {
        return [
            { content: c('Plan feature').t`1 - 5000 users *` },
            { content: c('Plan feature').t`5 GB storage / user` },
            {
                content: c('Plan feature').t`5 addresses / user`,
                info: multipleInfo,
            },
            { content: c('Plan feature').t`Unlimited folders / labels` },
            customEmail,
            accessProtonDrive,
        ];
    }

    if (planName === PLANS.VISIONARY && service === PLAN_SERVICES.MAIL) {
        return [
            { content: c('Plan feature').t`6 users` },
            { content: c('Plan feature').t`20 GB storage` },
            {
                content: c('Plan feature').t`50 addresses`,
                info: multipleInfo,
            },
            { content: c('Plan feature').t`Unlimited folders / labels` },
            customEmail,
            accessProtonDrive,
        ];
    }

    return [];
};

interface Props {
    planIDs: PlanIDs;
    currency: Currency;
    hasFreePlan?: boolean;
    hasPlanSelectionComparison?: boolean;
    cycle: Cycle;
    plans: Plan[];
    service: PLAN_SERVICES;
    organization?: Organization;
    loading?: boolean;
    mode?: 'signup' | 'settings';
    onChangePlanIDs: (newPlanIDs: PlanIDs) => void;
    onChangeCycle: (newCycle: Cycle) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    subscription?: Subscription;
    vpnCountries: VPNCountries;
}

const PlanSelection = ({
    mode,
    hasFreePlan = true,
    hasPlanSelectionComparison = true,
    planIDs,
    plans,
    cycle,
    currency,
    service,
    loading,
    organization,
    subscription,
    vpnCountries,
    onChangePlanIDs,
    onChangeCycle,
    onChangeCurrency,
}: Props) => {
    const currentPlan = subscription ? getPlan(subscription, service) : null;
    const isVpnApp = service === PLAN_SERVICES.VPN;
    const planNamesMap = toMap(plans, 'Name');
    const [vpnServersCount] = useVPNServersCount();

    const MailPlans = [
        hasFreePlan && FREE_MAIL_PLAN,
        planNamesMap[PLANS.PLUS],
        planNamesMap[PLANS.PROFESSIONAL],
        planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const VPNPlans = [
        hasFreePlan && FREE_VPN_PLAN,
        planNamesMap[PLANS.VPNBASIC],
        planNamesMap[PLANS.VPNPLUS],
        planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const plansToShow = isVpnApp ? VPNPlans : MailPlans;

    const planInfo = getPlanInfo(isVpnApp);

    const boldSave = <strong key="save">{c('Info').t`Save 20%`}</strong>;

    const isSignupMode = mode === 'signup';

    return (
        <>
            <div className="mb2 pb2 flex flex-nowrap on-mobile-flex-column">
                <div className="flex-item-fluid no-tablet no-mobile mr2" />
                <div className="flex-item-fluid flex-item-grow-2 text-center on-tablet-text-left on-mobile-mb2 on-mobile-text-center">
                    {cycle === CYCLE.MONTHLY ? (
                        <Button
                            shape="solid"
                            color="success"
                            disabled={loading}
                            size="medium"
                            onClick={() => onChangeCycle(CYCLE.YEARLY)}
                        >{c('Action').jt`${boldSave} by switching to annual billing`}</Button>
                    ) : null}
                </div>
                <div className="flex-item-fluid ml2 on-mobile-ml0 flex flex-nowrap cycle-currency-selectors">
                    <div className="flex-item-fluid flex flex-item-grow-2">
                        <CycleSelector
                            cycle={cycle}
                            onSelect={onChangeCycle}
                            disabled={loading}
                            options={[
                                { text: c('Billing cycle option').t`Monthly`, value: CYCLE.MONTHLY },
                                { text: c('Billing cycle option').t`Annually SAVE 20%`, value: CYCLE.YEARLY },
                                { text: c('Billing cycle option').t`Two years SAVE 33%`, value: CYCLE.TWO_YEARS },
                            ]}
                        />
                    </div>
                    <div className="flex-item-fluid flex ml1">
                        <CurrencySelector currency={currency} onSelect={onChangeCurrency} disabled={loading} />
                    </div>
                </div>
            </div>
            <div className="plan-selection mt1" style={{ '--plan-selection-number': plansToShow.length }}>
                {plansToShow.map((plan: Plan) => {
                    const isFree = plan.ID === FREE_MAIL_PLAN.ID || plan.ID === FREE_VPN_PLAN.ID;
                    const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
                    return (
                        <PlanCard
                            isCurrentPlan={!isSignupMode && isCurrentPlan}
                            action={c('Action').t`Select plan`}
                            planName={NAMES[plan.Name as PLANS]}
                            currency={currency}
                            disabled={loading}
                            cycle={cycle}
                            key={plan.ID}
                            price={plan.Pricing[cycle]}
                            info={planInfo[plan.Name as PLANS]}
                            features={getPlanFeatures(plan, service, vpnCountries, vpnServersCount)}
                            onClick={() => {
                                onChangePlanIDs(
                                    switchPlan({
                                        planIDs,
                                        plans,
                                        planID: isFree ? undefined : plan.ID,
                                        service,
                                        organization,
                                    })
                                );
                            }}
                        />
                    );
                })}
            </div>
            {hasPlanSelectionComparison && (
                <PlanSelectionComparison
                    service={service}
                    onChangePlanIDs={onChangePlanIDs}
                    plans={plans}
                    planNamesMap={planNamesMap}
                    planIDs={planIDs}
                />
            )}
        </>
    );
};

export default PlanSelection;
