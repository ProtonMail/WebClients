import { getCanWrite } from '@proton/shared/lib/calendar/permissions';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import unary from '@proton/utils/unary';

import { hasBit, toggleBit } from '../helpers/bitset';
import { Address, Api } from '../interfaces';
import {
    CALENDAR_TYPE,
    Calendar,
    CalendarUserSettings,
    CalendarWithOwnMembers,
    SubscribedCalendar,
    VisualCalendar,
} from '../interfaces/calendar';
import { GetAddressKeys } from '../interfaces/hooks/GetAddressKeys';
import { CALENDAR_FLAGS, MAX_CALENDARS_FREE, MAX_CALENDARS_PAID, SETTINGS_VIEW } from './constants';
import { reactivateCalendarsKeys } from './keys/reactivateCalendarKeys';

export const getIsCalendarActive = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.ACTIVE);
};

export const getIsCalendarDisabled = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.SELF_DISABLED) || hasBit(Flags, CALENDAR_FLAGS.SUPER_OWNER_DISABLED);
};

export const getDoesCalendarNeedReset = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED);
};

export const getDoesCalendarHaveInactiveKeys = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE);
};

export const getDoesCalendarNeedUserAction = ({ Flags } = { Flags: 0 }) => {
    return getDoesCalendarNeedReset({ Flags }) || getDoesCalendarHaveInactiveKeys({ Flags });
};

export const getIsCalendarProbablyActive = (calendar = { Flags: 0 }) => {
    // Calendars are treated as "active" if flags are undefined, this can happen when a new calendar was created and received through the event manager.
    // In this case, we assume everything went well and treat it as an active calendar.
    return calendar.Flags === undefined || (!getIsCalendarDisabled(calendar) && getIsCalendarActive(calendar));
};

export const getProbablyActiveCalendars = <T extends Calendar>(calendars: T[] = []): T[] => {
    return calendars.filter(unary(getIsCalendarProbablyActive));
};

export const getIsPersonalCalendar = (calendar: VisualCalendar | SubscribedCalendar): calendar is VisualCalendar => {
    return calendar.Type === CALENDAR_TYPE.PERSONAL;
};

export const getIsOwnedCalendar = (calendar: VisualCalendar) => {
    return calendar.Owner.Email === calendar.Members[0].Email;
};

export const getPersonalCalendars = <T extends Calendar>(calendars: T[] = []): T[] => {
    return calendars.filter(unary(getIsPersonalCalendar));
};

export const getIsCalendarWritable = (calendar: VisualCalendar) => {
    return getCanWrite(calendar.Permissions) && getIsPersonalCalendar(calendar);
};

export const getWritableCalendars = (calendars: VisualCalendar[]) => {
    return calendars.filter(unary(getIsCalendarWritable));
};

export const groupCalendarsByTaxonomy = (calendars: VisualCalendar[] = []) => {
    return calendars.reduce<{
        ownedPersonalCalendars: VisualCalendar[];
        sharedCalendars: VisualCalendar[];
        subscribedCalendars: VisualCalendar[];
    }>(
        (acc, calendar) => {
            if (getIsSubscribedCalendar(calendar)) {
                acc.subscribedCalendars.push(calendar);
            } else if (!getIsOwnedCalendar(calendar)) {
                acc.sharedCalendars.push(calendar);
            } else {
                acc.ownedPersonalCalendars.push(calendar);
            }
            return acc;
        },
        { ownedPersonalCalendars: [], sharedCalendars: [], subscribedCalendars: [] }
    );
};

export const getOwnedPersonalCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).ownedPersonalCalendars;
};

export const getSharedCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).sharedCalendars;
};

export const getSubscribedCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).subscribedCalendars;
};

enum CALENDAR_WEIGHT {
    PERSONAL = 0,
    SHARED = 1,
    SUBSCRIBED = 2,
}

const getCalendarWeight = (calendar: VisualCalendar) => {
    if (getIsPersonalCalendar(calendar)) {
        return getIsOwnedCalendar(calendar) ? CALENDAR_WEIGHT.PERSONAL : CALENDAR_WEIGHT.SHARED;
    }
    return CALENDAR_WEIGHT.SUBSCRIBED;
};
export const sortCalendars = (calendars: VisualCalendar[]) => {
    return [...calendars].sort((cal1, cal2) => {
        // personal owned calendars go first, shared second, and subscribed last
        const w1 = getCalendarWeight(cal1);
        const w2 = getCalendarWeight(cal2);

        return w1 - w2;
    });
};

export const getDefaultCalendar = (calendars: VisualCalendar[] = [], defaultCalendarID: string | null = '') => {
    // only active owned personal calendars can be default
    const activeOwnedCalendars = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars));
    if (!activeOwnedCalendars.length) {
        return;
    }
    return activeOwnedCalendars.find(({ ID }) => ID === defaultCalendarID) || activeOwnedCalendars[0];
};

export const getVisualCalendar = <T>(calendar: CalendarWithOwnMembers & T): VisualCalendar & T => {
    const [member] = calendar.Members;

    return {
        ...calendar,
        Name: member.Name,
        Description: member.Description,
        Color: member.Color,
        Display: member.Display,
        Email: member.Email,
        Flags: member.Flags,
        Permissions: member.Permissions,
    };
};

export const getVisualCalendars = <T>(calendars: (CalendarWithOwnMembers & T)[]): (VisualCalendar & T)[] =>
    calendars.map((calendar) => getVisualCalendar(calendar));

export const getCanCreateCalendar = (calendars: Calendar[], isFreeUser: boolean) => {
    const activeCalendars = getProbablyActiveCalendars(calendars);
    const disabledCalendars = calendars.filter(unary(getIsCalendarDisabled));
    const totalActionableCalendars = activeCalendars.length + disabledCalendars.length;
    if (totalActionableCalendars < calendars.length) {
        // calendar keys need to be reactivated before being able to create a calendar
        return false;
    }
    const calendarLimit = isFreeUser ? MAX_CALENDARS_FREE : MAX_CALENDARS_PAID;
    return totalActionableCalendars < calendarLimit;
};

export const getMaxUserCalendarsDisabled = (disabledCalendars: Calendar[], isFreeUser: boolean) => {
    const calendarLimit = isFreeUser ? MAX_CALENDARS_FREE : MAX_CALENDARS_PAID;

    return disabledCalendars.length === calendarLimit;
};

export const getCalendarWithReactivatedKeys = async ({
    calendar,
    api,
    silenceApi = true,
    addresses,
    getAddressKeys,
    successCallback,
    handleError,
}: {
    calendar: VisualCalendar;
    api: Api;
    silenceApi?: boolean;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    successCallback?: () => void;
    handleError?: (error: any) => void;
}) => {
    if (getDoesCalendarHaveInactiveKeys(calendar)) {
        try {
            const possiblySilentApi = <T>(config: any) => api<T>({ ...config, silence: silenceApi });

            await reactivateCalendarsKeys({
                calendars: [calendar],
                api: possiblySilentApi,
                addresses,
                getAddressKeys,
            });

            successCallback?.();

            return {
                ...calendar,
                Flags: toggleBit(calendar.Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE),
                Members: calendar.Members.map((member) => {
                    const newMember = { ...member };
                    if (newMember.Email === calendar.Email) {
                        newMember.Flags = toggleBit(calendar.Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE);
                    }
                    return newMember;
                }),
            };
        } catch (e) {
            handleError?.(e);

            return calendar;
        }
    }

    return calendar;
};

export const DEFAULT_CALENDAR_USER_SETTINGS: CalendarUserSettings = {
    WeekLength: 7,
    DisplayWeekNumber: 1,
    DefaultCalendarID: null,
    AutoDetectPrimaryTimezone: 1,
    PrimaryTimezone: 'UTC',
    DisplaySecondaryTimezone: 0,
    SecondaryTimezone: null,
    ViewPreference: SETTINGS_VIEW.WEEK,
    InviteLocale: null,
    AutoImportInvite: 0,
};
