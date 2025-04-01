import { PLANS, PLAN_SERVICES, PLAN_TYPES, type Plan, type PlanIDs } from '@proton/payments';
import noop from '@proton/utils/noop';

import { hasBit } from '../helpers/bitset';
import type { Api, UserModel } from '../interfaces';
import type { CalendarWithOwnMembers } from '../interfaces/calendar';
import { MAX_CALENDARS_FREE } from './constants';
import getHasSharedCalendars from './sharing/getHasSharedCalendars';

export const planHasPaidMail = (planIDs: PlanIDs, plans: Plan[]) => {
    const newPlanName = Object.keys(planIDs).find((planName) =>
        plans.find((plan) => plan.Type === PLAN_TYPES.PLAN && plan.Name === planName)
    );
    const newPlan = plans.find((plan) => plan.Name === newPlanName);

    return hasBit(newPlan?.Services, PLAN_SERVICES.MAIL);
};

export const getShouldCalendarPreventSubscripitionChange = async ({
    user,
    api,
    getCalendars,
    newPlan,
    plans,
}: {
    user: UserModel;
    api: Api;
    getCalendars: () => Promise<CalendarWithOwnMembers[] | undefined>;
    newPlan: PlanIDs;
    plans: Plan[];
}) => {
    const userBuysPassLifetime = (newPlan[PLANS.PASS_LIFETIME] ?? 0) > 0;
    const newPlanHasPaidMail = planHasPaidMail(newPlan, plans);

    // if user buys pass lifetime, then they will still keep their current plan. So if they already have
    // paid mail, then they will keep it.
    const userDoesntCancelMail = user.hasPaidMail && userBuysPassLifetime;

    if (!user.hasPaidMail || newPlanHasPaidMail || userDoesntCancelMail) {
        // We only prevent subscription change when downgrading the paid-mail condition
        return false;
    }
    const calendars = (await getCalendars().catch(noop)) || [];

    const hasSharedCalendars = await getHasSharedCalendars({ calendars, api, catchErrors: true });

    return calendars.length > MAX_CALENDARS_FREE || hasSharedCalendars;
};
