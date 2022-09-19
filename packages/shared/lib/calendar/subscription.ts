import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import { getIsOwnedCalendar, getIsPersonalCalendar } from '@proton/shared/lib/calendar/calendar';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { PLAN_SERVICES, PLAN_TYPES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Api, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import { CalendarUrlsResponse, CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';
import unary from '@proton/utils/unary';

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
    const calendars = (await getCalendars()) || [];
    const personalCalendars = calendars.filter(unary(getIsPersonalCalendar));

    const hasLinks = !!(
        await Promise.all(
            personalCalendars
                .filter(unary(getIsOwnedCalendar))
                .map((calendar) => api<CalendarUrlsResponse>(getPublicLinks(calendar.ID)))
        )
    ).flatMap(({ CalendarUrls }) => CalendarUrls).length;

    return personalCalendars.length > MAX_CALENDARS_FREE || hasLinks;
};
