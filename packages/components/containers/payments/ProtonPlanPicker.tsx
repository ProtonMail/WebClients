import React from 'react';
import { c } from 'ttag';
import { Cycle, Currency, Plan, Organization, Subscription, PlanIDs } from 'proton-shared/lib/interfaces';
import { CYCLE, PLANS, PLAN_SERVICES, APPS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { getPlan } from 'proton-shared/lib/helpers/subscription';
import { switchPlan } from 'proton-shared/lib/helpers/planIDs';
import { getAppName } from 'proton-shared/lib/apps/helper';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { FREE_MAIL_PLAN, FREE_VPN_PLAN } from 'proton-shared/lib/subscription/freePlans';

import { Radio, Button, InlineLinkButton, Price } from '../../components';
import { classnames } from '../../helpers';

const NAMES = {
    free_mail: 'Free',
    free_vpn: 'Free',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
} as const;

export interface Props {
    index?: number;
    cycle: Cycle;
    currency: Currency;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    onChangeCycle: (cycle: Cycle) => void;
    onBack: () => void;
    planIDs: PlanIDs;
    plans: Plan[];
    organization?: Organization;
    service: PLAN_SERVICES;
    subscription?: Subscription;
}

const ProtonPlanPicker = ({
    index,
    cycle,
    currency,
    onChangePlanIDs,
    onChangeCycle,
    onBack,
    planIDs,
    plans,
    organization,
    service,
    subscription,
}: Props) => {
    const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);
    const mailAppName = getAppName(APPS.PROTONMAIL);
    const planNamesMap = toMap(plans, 'Name');
    const MailPlans: Plan[] = [
        FREE_MAIL_PLAN,
        planNamesMap[PLANS.PLUS],
        planNamesMap[PLANS.PROFESSIONAL],
        index === 0 && service === PLAN_SERVICES.MAIL && planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const VPNPlans: Plan[] = [
        FREE_VPN_PLAN,
        planNamesMap[PLANS.VPNBASIC],
        planNamesMap[PLANS.VPNPLUS],
        index === 0 && service === PLAN_SERVICES.VPN && planNamesMap[PLANS.VISIONARY],
    ].filter(isTruthy);
    const serviceFreePlan = service === PLAN_SERVICES.VPN ? FREE_VPN_PLAN : FREE_MAIL_PLAN;
    const currentPlan = subscription ? getPlan(subscription, service) : serviceFreePlan;
    const plansToShow = service === PLAN_SERVICES.VPN ? VPNPlans : MailPlans;
    const currentPlanText = c('Plan info').t`(current plan)`;

    const annualBilling = (
        <InlineLinkButton key="annual-billing" onClick={() => onChangeCycle(CYCLE.YEARLY)}>{c('Action')
            .t`annual billing`}</InlineLinkButton>
    );
    const save20 = <span className="TODO" key="save-20">{c('Info').t`Save 20%`}</span>;

    if (index === 1 && planIDs[planNamesMap[PLANS.VISIONARY].ID]) {
        return null;
    }

    return (
        <div className="pb2 mb2 border-bottom">
            <h2 className="text-2xl text-bold">{service === PLAN_SERVICES.VPN ? vpnAppName : mailAppName} plan</h2>
            {index === 0 && cycle === CYCLE.MONTHLY ? (
                <p>{c('Info').jt`${save20} on your subscription by switching to ${annualBilling}`}</p>
            ) : null}
            {index === 1 && service === PLAN_SERVICES.MAIL ? (
                <p>{c('Info').jt`${save20} on both Mail and VPN by adding a Mail subscription.`}</p>
            ) : null}
            {index === 1 && service === PLAN_SERVICES.VPN ? (
                <p>{c('Info').jt`${save20} on both VPN and Mail by adding a VPN subscription.`}</p>
            ) : null}
            <ul className="unstyled">
                {plansToShow.map((plan) => {
                    const isFree = plan.ID === FREE_MAIL_PLAN.ID || plan.ID === FREE_VPN_PLAN.ID;
                    const isCurrentPlan = currentPlan?.ID === plan.ID;
                    const checked = isFree ? plansToShow.every((plan) => !planIDs[plan.ID]) : !!planIDs[plan.ID];
                    return (
                        <li key={plan.ID} className="mb0-75">
                            <Radio
                                checked={checked}
                                name={`plan${service}`}
                                className="flex flex-nowrap flex-align-items-center"
                                id={`${plan.ID}${service}`}
                                onChange={() => {
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
                            >
                                <span className="flex-item-fluid pl1 pr0-5">
                                    {NAMES[plan.Name as PLANS]}
                                    {isCurrentPlan ? (
                                        <>
                                            {' '}
                                            <span className="color-hint inline-block">{currentPlanText}</span>
                                        </>
                                    ) : (
                                        ''
                                    )}
                                </span>
                                <span className={classnames([!checked && 'color-hint'])}>
                                    {isFree ? (
                                        <span>{c('Free price').t`Free`}</span>
                                    ) : (
                                        <Price currency={currency} suffix={c('Suffix for price').t`/ month`}>
                                            {plan.Pricing[cycle] / cycle}
                                        </Price>
                                    )}
                                </span>
                            </Radio>
                        </li>
                    );
                })}
            </ul>
            <Button color="weak" onClick={() => onBack()}>{c('Action').t`Compare plans`}</Button>
        </div>
    );
};

export default ProtonPlanPicker;
