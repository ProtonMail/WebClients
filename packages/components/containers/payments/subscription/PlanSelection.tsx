import React from 'react';
import { c } from 'ttag';
import { Currency, Cycle, Organization, Plan, PlanIDs, Subscription, VPNCountries } from 'proton-shared/lib/interfaces';
import { toMap } from 'proton-shared/lib/helpers/object';
import {
    APPS,
    CYCLE,
    DEFAULT_CURRENCY,
    DEFAULT_CYCLE,
    PLAN_SERVICES,
    PLAN_TYPES,
    PLANS,
} from 'proton-shared/lib/constants';
import { switchPlan } from 'proton-shared/lib/helpers/planIDs';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { getPlan } from 'proton-shared/lib/helpers/subscription';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Button, Info } from '../../../components';

import CurrencySelector from '../CurrencySelector';
import CycleSelector from '../CycleSelector';

import PlanCard, { PlanCardFeature } from './PlanCard';

import './PlanSelection.scss';
import PlanSelectionComparison from './PlanSelectionComparison';

const FREE_PLAN = {
    ID: 'free',
    Name: 'free_mail' as PLANS,
    Title: 'Free',
    Type: PLAN_TYPES.PLAN,
    Currency: DEFAULT_CURRENCY,
    Cycle: DEFAULT_CYCLE,
    Amount: 0,
    MaxDomains: 0,
    MaxAddresses: 0,
    MaxSpace: 0,
    MaxMembers: 0,
    MaxVPN: 0,
    MaxTier: 0,
    Services: PLAN_SERVICES.MAIL + PLAN_SERVICES.VPN,
    Quantity: 1,
    Features: 0,
    Pricing: {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.TWO_YEARS]: 0,
    },
} as Plan;

const NAMES = {
    free_mail: 'Free',
    free_vpn: 'Free',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
} as const;

const getFeatures = (
    planName: keyof typeof NAMES,
    service: PLAN_SERVICES,
    vpnCountries: VPNCountries
): PlanCardFeature[] => {
    const netflix = <b key={1}>{c('Netflix').t`Netflix`}</b>;
    const disney = <b key={2}>{c('Disney').t`Disney+`}</b>;
    const primeVideo = <b key={3}>{c('Prime Video').t`Prime Video`}</b>;
    const many = <b key={4}>{c('Many Others').t`and many others`}</b>;
    const freeCountries = vpnCountries.free.length;
    const basicCountries = vpnCountries.basic.length;
    const allCountries = vpnCountries.all.length;

    const mailAppName = getAppName(APPS.PROTONMAIL);
    const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

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

    if (planName === 'free_vpn') {
        return [
            { content: c('Plan feature').t`17 servers in ${freeCountries} countries` },
            { content: c('Plan feature').t`1 VPN connection` },
            { content: c('Plan feature').t`Medium speed` },
            { ...adBlocker, notIncluded: true },
            { ...secureCore, notIncluded: true },
            { ...streamingService, notIncluded: true },
        ];
    }

    if (planName === PLANS.VPNBASIC) {
        return [
            { content: c('Plan feature').t`350+ servers in ${basicCountries} countries` },
            { content: c('Plan feature').t`2 VPN connections` },
            { content: c('Plan feature').t`High speed` },
            adBlocker,
            { ...secureCore, notIncluded: true },
            { ...streamingService, notIncluded: true },
        ];
    }

    if (planName === PLANS.VPNPLUS) {
        return [
            { content: c('Plan feature').t`1200+ servers in ${allCountries} countries` },
            { content: c('Plan feature').t`5 VPN connections` },
            { content: c('Plan feature').t`Highest speed (up to 10Gbps)` },
            adBlocker,
            secureCore,
            streamingService,
        ];
    }

    if (planName === PLANS.VISIONARY && service === PLAN_SERVICES.VPN) {
        return [
            { content: c('Plan feature').t`All plan features` },
            { content: c('Plan feature').t`10 VPN connections` },
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

    if (planName === 'free_mail') {
        return [
            { content: c('Plan feature').t`1 user` },
            { content: c('Plan feature').t`0.5 GB storage` },
            { content: c('Plan feature').t`1 address` },
            { content: c('Plan feature').t`3 folders / labels` },
            { ...customEmail, notIncluded: true },
        ];
    }

    const multipleInfo = (
        <Info
            title={c('Tooltip')
                .t`Use multiple addresses / aliases linked to your account, e.g. username2@protonmail.com`}
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
    const mailAppName = getAppName(APPS.PROTONMAIL);
    const isVpnApp = service === PLAN_SERVICES.VPN;
    const planNamesMap = toMap(plans, 'Name');
    const MailPlans = [
        hasFreePlan && FREE_PLAN,
        planNamesMap[PLANS.PLUS],
        planNamesMap[PLANS.PROFESSIONAL],
        planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const VPNPlans = [
        hasFreePlan && { ...FREE_PLAN, Name: 'free_vpn' as PLANS },
        planNamesMap[PLANS.VPNBASIC],
        planNamesMap[PLANS.VPNPLUS],
        planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const plansToShow = isVpnApp ? VPNPlans : MailPlans;

    const INFOS = {
        free_mail: c('Info').t`The basic for private and secure communications.`,
        free_vpn: c('Info').t`A free and uncensored Internet should be available to all.`,
        [PLANS.VPNBASIC]: c('Info').t`Starter VPN service with P2P support and Adblocker.`,
        [PLANS.VPNPLUS]: c('Info').t`Full-featured VPN with speed up to 10 Gbits/s.`,
        [PLANS.PLUS]: c('Info').t`Full-featured mailbox with advanced protection.`,
        [PLANS.PROFESSIONAL]: c('Info').t`${mailAppName} for professionals and businesses.`,
        [PLANS.VISIONARY]: isVpnApp
            ? c('Info').t`VPN + ${mailAppName} bundle for families and small businesses.`
            : c('Info').t`Mail + VPN bundle for families and small businesses.`,
    } as const;

    const boldSave = <strong key="save">{c('Info').t`Save 20%`}</strong>;

    const isSignupMode = mode === 'signup';

    return (
        <>
            <div className="mb2 pb2 flex flex-nowrap on-mobile-flex-column">
                <div className="flex-item-fluid no-tablet no-mobile" />
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
                <div className="flex-item-fluid ml2 pl1 on-mobile-ml0 on-mobile-pl0 flex flex-nowrap cycle-currency-selectors">
                    <CycleSelector
                        cycle={cycle}
                        onSelect={onChangeCycle}
                        className="mr1"
                        disabled={loading}
                        options={[
                            { text: c('Billing cycle option').t`Monthly`, value: CYCLE.MONTHLY },
                            { text: c('Billing cycle option').t`Annually SAVE 20%`, value: CYCLE.YEARLY },
                            { text: c('Billing cycle option').t`Two years SAVE 33%`, value: CYCLE.TWO_YEARS },
                        ]}
                    />
                    <CurrencySelector currency={currency} onSelect={onChangeCurrency} disabled={loading} />
                </div>
            </div>
            <div className="plan-selection mt1" style={{ '--plan-selection-number': plansToShow.length }}>
                {plansToShow.map((plan: Plan) => {
                    const isFree = plan.ID === FREE_PLAN.ID;
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
                            info={INFOS[plan.Name as PLANS]}
                            features={getFeatures(plan.Name as PLANS, service, vpnCountries)}
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
                    planIDs={planIDs}
                />
            )}
        </>
    );
};

export default PlanSelection;
