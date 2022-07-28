import isTruthy from '@proton/utils/isTruthy';
import unary from '@proton/utils/unary';
import { hasBit, toggleBit } from '../helpers/bitset';
import { CALENDAR_FLAGS, MAX_CALENDARS_FREE, MAX_CALENDARS_PAID, SETTINGS_VIEW } from './constants';
import { Calendar, CalendarUserSettings, CalendarWithMembers, VisualCalendar } from '../interfaces/calendar';
import { getIsPersonalCalendar } from './subscribe/helpers';
import { Address, Api } from '../interfaces';
import { GetAddressKeys } from '../interfaces/hooks/GetAddressKeys';
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

export const getPersonalCalendars = <T extends Calendar>(calendars: T[] = []): T[] => {
    return calendars.filter(unary(getIsPersonalCalendar));
};

export const getDefaultCalendar = <T extends Calendar>(
    calendars: T[] = [],
    defaultCalendarID: string | null = ''
): T | undefined => {
    // only personal calendars can be default
    const personalCalendars = getPersonalCalendars(calendars);
    if (!personalCalendars.length) {
        return;
    }
    return personalCalendars.find(({ ID }) => ID === defaultCalendarID) || personalCalendars[0];
};

export const getVisualCalendar = <T>(calendar: CalendarWithMembers & T, addressID: string): VisualCalendar & T => {
    const member = calendar.Members.find(({ AddressID }) => AddressID === addressID);
    if (!member) {
        throw new Error('Calendar member could not be found');
    }

    return {
        ...calendar,
        Email: member.Email,
        Flags: member.Flags,
        Color: member.Color,
        Display: member.Display,
    };
};

export const getVisualCalendars = <T>(
    calendars: (CalendarWithMembers & T)[],
    addresses: Address[]
): (VisualCalendar & T)[] => {
    return calendars
        .map((calendar) => {
            const member = calendar.Members.find(
                ({ Email: memberEmail }) => !!addresses.find(({ Email: addressEmail }) => memberEmail === addressEmail)
            );
            if (!member) {
                // such calendar becomes invisible
                return;
            }
            return {
                ...calendar,
                Email: member.Email,
                Flags: member.Flags,
                Color: member.Color,
                Display: member.Display,
            };
        })
        .filter(isTruthy);
};

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
