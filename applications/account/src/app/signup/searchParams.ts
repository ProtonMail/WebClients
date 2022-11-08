import * as History from 'history';

import { DEFAULT_CYCLE, PLAN_TYPES } from '@proton/shared/lib/constants';
import { getSupportedAddons } from '@proton/shared/lib/helpers/planIDs';
import { getValidCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency, Plan } from '@proton/shared/lib/interfaces';

import { SERVICES, SERVICES_KEYS } from './interfaces';

export const getSignupSearchParams = (search: History.Search) => {
    const searchParams = new URLSearchParams(search);

    const maybeCurrency = searchParams.get('currency')?.toUpperCase() as Currency | undefined;
    const currency = maybeCurrency && ['EUR', 'CHF', 'USD'].includes(maybeCurrency) ? maybeCurrency : undefined;

    const maybeCycle = Number(searchParams.get('billing')) || Number(searchParams.get('cycle'));
    const cycle = getValidCycle(maybeCycle);

    const maybeMinimumCycle = Number(searchParams.get('minimumCycle'));
    const minimumCycle = getValidCycle(maybeMinimumCycle);

    const maybeUsers = Number(searchParams.get('users'));
    const users = maybeUsers >= 1 && maybeUsers <= 5000 ? maybeUsers : undefined;
    const maybeDomains = Number(searchParams.get('domains'));
    const domains = maybeDomains >= 1 && maybeDomains <= 100 ? maybeDomains : undefined;

    const maybeService = (searchParams.get('service') || searchParams.get('product')) as SERVICES_KEYS | undefined;
    const service = maybeService ? SERVICES[maybeService] : undefined;

    // plan is validated by comparing plans after it's loaded
    const maybePreSelectedPlan = searchParams.get('plan');
    // static sites use 'business' for pro plan
    const preSelectedPlan = maybePreSelectedPlan === 'business' ? 'professional' : maybePreSelectedPlan;

    const referrer = searchParams.get('referrer') || undefined; // referral ID
    const invite = searchParams.get('invite') || undefined;
    const coupon = searchParams.get('coupon') || undefined;
    const type = searchParams.get('type') || undefined;

    return {
        coupon,
        currency,
        cycle: cycle || DEFAULT_CYCLE,
        minimumCycle,
        preSelectedPlan,
        service,
        users,
        domains,
        referrer,
        invite,
        type,
    };
};
export type SignupParameters = ReturnType<typeof getSignupSearchParams>;

export const getPlanIDsFromParams = (plans: Plan[], signupParameters: SignupParameters) => {
    if (!signupParameters.preSelectedPlan) {
        return;
    }

    if (signupParameters.preSelectedPlan === 'free') {
        return {};
    }

    const plan = plans.find(({ Name, Type }) => {
        return Name === signupParameters.preSelectedPlan && Type === PLAN_TYPES.PLAN;
    });

    if (!plan) {
        return;
    }

    const planIDs = { [plan.Name]: 1 };
    const supportedAddons = getSupportedAddons(planIDs);

    if (signupParameters.users !== undefined) {
        const usersAddon = plans.find(
            ({ Name }) => Name.startsWith('1member') && supportedAddons[Name as keyof typeof supportedAddons]
        );
        const amount = signupParameters.users - plan.MaxMembers;
        if (usersAddon && amount > 0) {
            planIDs[usersAddon.Name] = amount;
        }
    }

    if (signupParameters.domains !== undefined) {
        const domainsAddon = plans.find(
            ({ Name }) => Name.startsWith('1domain') && supportedAddons[Name as keyof typeof supportedAddons]
        );
        const amount = signupParameters.domains - plan.MaxDomains;
        if (domainsAddon && amount > 0) {
            planIDs[domainsAddon.Name] = amount;
        }
    }

    return planIDs;
};
