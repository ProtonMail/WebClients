import { PLAN_SERVICES, PLAN_TYPES, type PlanIDs } from '@proton/payments';
import noop from '@proton/utils/noop';

import { hasBit } from '../helpers/bitset';
import type { Api, Plan } from '../interfaces';
import type { CalendarWithOwnMembers } from '../interfaces/calendar';
import { MAX_CALENDARS_FREE } from './constants';
import getHasSharedCalendars from './sharing/getHasSharedCalendars';

export const willHavePaidMail = (planIDs: PlanIDs, plans: Plan[]) => {
    const newPlanName = Object.keys(planIDs).find((planName) =>
        plans.find((plan) => plan.Type === PLAN_TYPES.PLAN && plan.Name === planName)
    );
    const newPlan = plans.find((plan) => plan.Name === newPlanName);

    return hasBit(newPlan?.Services, PLAN_SERVICES.MAIL);
};

export const getShouldCalendarPreventSubscripitionChange = async ({
    hasPaidMail,
    willHavePaidMail,
    api,
    getCalendars,
}: {
    hasPaidMail: boolean;
    willHavePaidMail: boolean;
    api: Api;
    getCalendars: () => Promise<CalendarWithOwnMembers[] | undefined>;
}) => {
    if (!hasPaidMail || willHavePaidMail) {
        // We only prevent subscription change when downgrading the paid-mail condition
        return false;
    }
    const calendars = (await getCalendars().catch(noop)) || [];

    const hasSharedCalendars = await getHasSharedCalendars({ calendars, api, catchErrors: true });

    return calendars.length > MAX_CALENDARS_FREE || hasSharedCalendars;
};
