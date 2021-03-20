import React, { useRef } from 'react';
import { c } from 'ttag';
import { Currency, Cycle, Organization, Plan, PlanIDs, Subscription } from 'proton-shared/lib/interfaces';
import { toMap } from 'proton-shared/lib/helpers/object';
import {
    APPS,
    PLANS,
    PLAN_TYPES,
    PLAN_SERVICES,
    CYCLE,
    DEFAULT_CYCLE,
    DEFAULT_CURRENCY,
} from 'proton-shared/lib/constants';
import { switchPlan } from 'proton-shared/lib/helpers/planIDs';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { getPlan } from 'proton-shared/lib/helpers/subscription';

import { Icon, InlineLinkButton, Button } from '../../../components';

import CurrencySelector from '../CurrencySelector';
import CycleSelector from '../CycleSelector';

import PlanCard from './PlanCard';
import MailFeatures from './MailFeatures';
import VPNFeatures from './VPNFeatures';

import './PlanSelection.scss';

const EmDash = '—';

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

const getFeatures = (planName: PLANS, service: PLAN_SERVICES) => {
    return {
        free_mail: [
            { content: c('Plan feature').t`1 user` },
            { content: c('Plan feature').t`0.5 GB storage` },
            { content: c('Plan feature').t`1 address` },
            { content: c('Plan feature').t`3 folders / labels` },
            { content: c('Plan feature').t`No custom email addresses`, icon: EmDash, className: 'opacity-50' },
        ],
        free_vpn: [
            { content: c('Plan feature').t`Open-source, audited, no-logs` },
            { content: c('Plan feature').t`17 servers in 3 countries` },
            { content: c('Plan feature').t`1 VPN connection` },
            { content: c('Plan feature').t`Adblocker (Netshield)`, icon: EmDash, className: 'opacity-50' },
            { content: c('Plan feature').t`Exclusive SecureCore servers`, icon: EmDash, className: 'opacity-50' },
        ],
        [PLANS.VPNBASIC]: [
            { content: c('Plan feature').t`Open-source, audited, no-logs` },
            { content: c('Plan feature').t`350+ servers in 54 countries` },
            { content: c('Plan feature').t`2 VPN connections` },
            {
                content: c('Plan feature').t`Adblocker (Netshield)`,
                tooltip: c('Tooltip')
                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`,
            },
            { content: c('Plan feature').t`Exclusive SecureCore servers`, icon: EmDash, className: 'opacity-50' },
        ],
        [PLANS.VPNPLUS]: [
            { content: c('Plan feature').t`Open-source, audited, no-logs` },
            { content: c('Plan feature').t`1200+ servers in 54 countries` },
            { content: c('Plan feature').t`5 VPN connections` },
            {
                content: c('Plan feature').t`Adblocker (Netshield)`,
                tooltip: c('Tooltip')
                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`,
            },
            {
                content: c('Plan feature').t`Exclusive SecureCore servers`,
                tooltip: c('Tooltip')
                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`,
            },
        ],
        [PLANS.PLUS]: [
            { content: c('Plan feature').t`1 user` },
            { content: c('Plan feature').t`5 GB storage *` },
            {
                content: c('Plan feature').t`5 addresses`,
                tooltip: c('Tooltip')
                    .t`Use multiple addresses / aliases linked to your account, e.g. username2@protonmail.com`,
            },
            { content: c('Plan feature').t`200 folders / labels` },
            {
                content: c('Plan feature').t`Custom email addresses`,
                tooltip: c('Tooltip').t`Host emails for your own domain(s) at ProtonMail, e.g. john.smith@example.com`,
            },
        ],
        [PLANS.PROFESSIONAL]: [
            { content: c('Plan feature').t`1 - 5000 users *` },
            { content: c('Plan feature').t`5 GB storage / user` },
            {
                content: c('Plan feature').t`5 addresses / user`,
                tooltip: c('Tooltip')
                    .t`Use multiple addresses / aliases linked to your account, e.g. username2@protonmail.com`,
            },
            { content: c('Plan feature').t`Unlimited folders / labels` },
            {
                content: c('Plan feature').t`Custom email addresses`,
                tooltip: c('Tooltip').t`Host emails for your own domain(s) at ProtonMail, e.g. john.smith@example.com`,
            },
        ],
        [PLANS.VISIONARY]:
            service === PLAN_SERVICES.VPN
                ? [
                      { content: c('Plan feature').t`All plan features` },
                      {
                          content: c('Plan feature').t`ProtonMail Visionary account`,
                          tooltip: c('Tooltip')
                              .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that million use to protect their data) with one plan.`,
                      },
                      { content: c('Plan feature').t`10 VPN connections` },
                      { content: c('Plan feature').t`Early access to new products` },
                      { content: c('Plan feature').t`Support Proton Technologies!` },
                  ]
                : [
                      { content: c('Plan feature').t`6 users` },
                      { content: c('Plan feature').t`20 GB storage` },
                      {
                          content: c('Plan feature').t`50 addresses`,
                          tooltip: c('Tooltip')
                              .t`Use multiple addresses / aliases linked to your account, e.g. username2@protonmail.com`,
                      },
                      { content: c('Plan feature').t`Unlimited folders / labels` },
                      {
                          content: c('Plan feature').t`Custom email addresses`,
                          tooltip: c('Tooltip')
                              .t`Host emails for your own domain(s) at ProtonMail, e.g. john.smith@example.com`,
                      },
                  ],
    }[planName];
};

interface Props {
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    plans: Plan[];
    service: PLAN_SERVICES;
    organization?: Organization;
    loading?: boolean;
    onChangePlanIDs: (newPlanIDs: PlanIDs) => void;
    onChangeCycle: (newCycle: Cycle) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    subscription?: Subscription;
}

const PlanSelection = ({
    planIDs,
    plans,
    cycle,
    currency,
    service,
    loading,
    organization,
    subscription,
    onChangePlanIDs,
    onChangeCycle,
    onChangeCurrency,
}: Props) => {
    const currentPlan = subscription ? getPlan(subscription, service) : null;
    const featuresRef = useRef<HTMLDivElement>(null);
    const mailAppName = getAppName(APPS.PROTONMAIL);
    const isVpnApp = service === PLAN_SERVICES.VPN;
    const planNamesMap = toMap(plans, 'Name');
    const MailPlans = [
        FREE_PLAN,
        planNamesMap[PLANS.PLUS],
        planNamesMap[PLANS.PROFESSIONAL],
        planNamesMap[PLANS.VISIONARY],
    ];
    const VPNPlans = [
        { ...FREE_PLAN, Name: 'free_vpn' as PLANS },
        planNamesMap[PLANS.VPNBASIC],
        planNamesMap[PLANS.VPNPLUS],
        planNamesMap[PLANS.VISIONARY],
    ];
    const plansToShow = isVpnApp ? VPNPlans : MailPlans;

    const INFOS = {
        free_mail: c('Info').t`The basic for private and secure communications.`,
        free_vpn: c('Info').t`A free and uncensored Internet should be available to all.`,
        [PLANS.VPNBASIC]: c('Info').t`Starter VPN service with P2P support and Adblocker.`,
        [PLANS.VPNPLUS]: c('Info').t`Full-featured VPN with speed up to 10 Gbit/s.`,
        [PLANS.PLUS]: c('Info').t`Full-featured mailbox with advanced protection.`,
        [PLANS.PROFESSIONAL]: c('Info').t`${mailAppName} for professionals and businesses.`,
        [PLANS.VISIONARY]: isVpnApp
            ? c('Info').t`VPN + ${mailAppName} bundle for families and small businesses.`
            : c('Info').t`Mail + VPN bundle for families and small businesses.`,
    } as const;

    const boldSave = <strong key="save">{c('Info').t`Save 20%`}</strong>;

    const handleScroll = () => {
        const container = document.querySelector('.modal-content-inner');
        if (!featuresRef.current || !container) {
            return;
        }
        const { offsetTop } = featuresRef.current;
        container.scroll({
            top: offsetTop,
            behavior: 'smooth',
        });
    };

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
                        // <div className="h100 relative">
                        <PlanCard
                            isCurrentPlan={isCurrentPlan}
                            action={c('Action').t`Select plan`}
                            planName={NAMES[plan.Name as PLANS]}
                            currency={currency}
                            disabled={loading}
                            cycle={cycle}
                            key={plan.ID}
                            price={plan.Pricing[cycle]}
                            info={INFOS[plan.Name as PLANS]}
                            features={getFeatures(plan.Name as PLANS, service)}
                            onClick={() =>
                                onChangePlanIDs(
                                    switchPlan({
                                        planIDs,
                                        plans,
                                        planID: isFree ? undefined : plan.ID,
                                        service,
                                        organization,
                                    })
                                )
                            }
                        />
                        // </div>
                    );
                })}
            </div>
            <p className="text-sm">{c('Info').t`* Customizable features`}</p>
            <p className="text-center">
                <InlineLinkButton onClick={handleScroll}>
                    <span className="mr0-5">{c('Action').t`Compare all features`}</span>
                    <Icon name="arrow-down" className="align-sub" />
                </InlineLinkButton>
            </p>
            <div ref={featuresRef}>
                {service === PLAN_SERVICES.MAIL ? (
                    <>
                        <MailFeatures
                            onSelect={(planName) => {
                                const plan = plans.find(({ Name }) => Name === planName);
                                onChangePlanIDs(
                                    switchPlan({
                                        planIDs,
                                        plans,
                                        planID: plan?.ID,
                                        service,
                                        organization,
                                    })
                                );
                            }}
                        />
                        <p className="text-sm mt1 mb1">
                            * {c('Info concerning plan features').t`Customizable features`}
                        </p>
                        <p className="text-sm mt0 mb1">
                            **{' '}
                            {c('Info concerning plan features')
                                .t`ProtonMail cannot be used for mass emailing or spamming. Legitimate emails are unlimited.`}
                        </p>
                    </>
                ) : null}
                {service === PLAN_SERVICES.VPN ? (
                    <VPNFeatures
                        onSelect={(planName) => {
                            const plan = plans.find(({ Name }) => Name === planName);
                            onChangePlanIDs(
                                switchPlan({
                                    planIDs,
                                    plans,
                                    planID: plan?.ID,
                                    service,
                                    organization,
                                })
                            );
                        }}
                    />
                ) : null}
            </div>
        </>
    );
};

export default PlanSelection;
