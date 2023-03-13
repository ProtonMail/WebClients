import unary from '@proton/utils/unary';

import { hasBit, toggleBit } from '../helpers/bitset';
import { Address, Api } from '../interfaces';
import {
    Calendar,
    CalendarUserSettings,
    CalendarWithOwnMembers,
    SubscribedCalendar,
    VisualCalendar,
} from '../interfaces/calendar';
import { GetAddressKeys } from '../interfaces/hooks/GetAddressKeys';
import { getHasUserReachedCalendarsLimit } from './calendarLimits';
import { CALENDAR_FLAGS, CALENDAR_TYPE, SETTINGS_VIEW } from './constants';
import { reactivateCalendarsKeys } from './crypto/keys/reactivateCalendarKeys';
import { getCanWrite } from './permissions';

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

export const getIsOwnedCalendar = (calendar: CalendarWithOwnMembers) => {
    return calendar.Owner.Email === calendar.Members[0].Email;
};

export const getIsSubscribedCalendar = (
    calendar: Calendar | VisualCalendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.SUBSCRIPTION;
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
        unknownCalendars: VisualCalendar[];
    }>(
        (acc, calendar) => {
            if (getIsSubscribedCalendar(calendar)) {
                acc.subscribedCalendars.push(calendar);
            } else if (getIsPersonalCalendar(calendar)) {
                const calendarsGroup = getIsOwnedCalendar(calendar) ? acc.ownedPersonalCalendars : acc.sharedCalendars;
                calendarsGroup.push(calendar);
            } else {
                acc.unknownCalendars.push(calendar);
            }
            return acc;
        },
        { ownedPersonalCalendars: [], sharedCalendars: [], subscribedCalendars: [], unknownCalendars: [] }
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
    SUBSCRIBED = 1,
    SHARED = 2,
    UNKNOWN = 3,
}

const getCalendarWeight = (calendar: VisualCalendar) => {
    if (getIsPersonalCalendar(calendar)) {
        return getIsOwnedCalendar(calendar) ? CALENDAR_WEIGHT.PERSONAL : CALENDAR_WEIGHT.SHARED;
    }
    if (getIsSubscribedCalendar(calendar)) {
        return CALENDAR_WEIGHT.SUBSCRIBED;
    }
    return CALENDAR_WEIGHT.UNKNOWN;
};
export const sortCalendars = (calendars: VisualCalendar[]) => {
    return [...calendars].sort((cal1, cal2) => {
        // personal owned calendars go first, shared second, and subscribed last
        return getCalendarWeight(cal1) - getCalendarWeight(cal2);
    });
};

const getPreferredCalendar = (calendars: VisualCalendar[] = [], defaultCalendarID: string | null = '') => {
    if (!calendars.length) {
        return;
    }
    return calendars.find(({ ID }) => ID === defaultCalendarID) || calendars[0];
};

export const getPreferredActiveWritableCalendar = (
    calendars: VisualCalendar[] = [],
    defaultCalendarID: string | null = ''
) => {
    return getPreferredCalendar(getProbablyActiveCalendars(getWritableCalendars(calendars)), defaultCalendarID);
};

export const getDefaultCalendar = (calendars: VisualCalendar[] = [], defaultCalendarID: string | null = '') => {
    // only active owned personal calendars can be default
    return getPreferredCalendar(getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars)), defaultCalendarID);
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

export const getCanCreateCalendar = ({
    calendars,
    ownedPersonalCalendars,
    disabledCalendars,
    isFreeUser,
}: {
    calendars: VisualCalendar[];
    ownedPersonalCalendars: VisualCalendar[];
    disabledCalendars: VisualCalendar[];
    isFreeUser: boolean;
}) => {
    const { isCalendarsLimitReached } = getHasUserReachedCalendarsLimit(calendars, isFreeUser);
    if (isCalendarsLimitReached) {
        return false;
    }
    // TODO: The following if condition is very flaky. We should check that somewhere else
    const activeCalendars = getProbablyActiveCalendars(ownedPersonalCalendars);
    const totalActionableCalendars = activeCalendars.length + disabledCalendars.length;
    if (totalActionableCalendars < ownedPersonalCalendars.length) {
        // calendar keys need to be reactivated before being able to create a calendar
        return false;
    }

    return true;
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
