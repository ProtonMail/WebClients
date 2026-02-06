import type { selectCalendarsBootstrap } from '@proton/calendar/selectCalendarsBootstrap';
import { getPersonalCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

const getPersonalCalendarsLength = (calendars: VisualCalendar[]) => {
    return getPersonalCalendars(calendars).length;
};

export interface CalendarsToAct {
    calendarsToReset: VisualCalendar[];
    calendarsToReactivate: VisualCalendar[];
    calendarsToClean: VisualCalendar[];
    calendarsIncomplete: VisualCalendar[];
    info: {
        unlockAny: boolean;
        unlockAll: boolean;
    };
}

export const getCalendarsToAct = ({
    calendars,
    calendarBootstrap,
}: {
    calendars: VisualCalendar[];
    calendarBootstrap: ReturnType<typeof selectCalendarsBootstrap>;
}): CalendarsToAct => {
    const someEmptyBootstrap = calendars.some((calendar) => !calendarBootstrap[calendar.ID]?.value?.Members?.[0]);

    const defaultInfo = {
        unlockAny: false,
        unlockAll: false,
    };
    const defaultCalendars = {
        calendarsToReset: [],
        calendarsToReactivate: [],
        calendarsToClean: [],
        calendarsIncomplete: [],
    };
    const defaultResult: CalendarsToAct = {
        ...defaultCalendars,
        info: defaultInfo,
    };

    // The reactivation route requires all calendars in the request.
    // This makes sure we only act once everything we're sure to have all flags.
    if (someEmptyBootstrap) {
        return defaultResult;
    }
    const result = calendars.reduce<Omit<CalendarsToAct, 'info'>>((acc, calendar) => {
        const [firstMember] = calendarBootstrap[calendar.ID]?.value?.Members || [];
        const Flags = firstMember?.Flags;

        if (hasBit(Flags, CALENDAR_FLAGS.INCOMPLETE_SETUP)) {
            acc.calendarsIncomplete.push(calendar);
        }
        if (hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED)) {
            acc.calendarsToReset.push(calendar);
        } else if (hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE)) {
            acc.calendarsToReactivate.push(calendar);
        } else if (hasBit(Flags, CALENDAR_FLAGS.LOST_ACCESS)) {
            acc.calendarsToClean.push(calendar);
        }

        return acc;
    }, defaultCalendars);

    const calendarsToUnlock = [...result.calendarsToReset, ...result.calendarsToReactivate, ...result.calendarsToClean];

    // Don't take into account subscribed calendars to decide whether to show a partial list of the calendars that need reset.
    // Although we do need to reset the calendar keys for those, they will be immediately re-synced so the users should not see them "locked"
    const numberOfPersonalCalendars = getPersonalCalendarsLength(calendars);
    const numberOfPersonalCalendarsToUnlock = getPersonalCalendarsLength(calendarsToUnlock);
    const hasOnlySubscribedCalendarsToUnlock = numberOfPersonalCalendarsToUnlock === 0;
    const unlockAll =
        hasOnlySubscribedCalendarsToUnlock || numberOfPersonalCalendars === numberOfPersonalCalendarsToUnlock;

    const unlockAny = calendarsToUnlock.length > 0;

    return {
        ...result,
        info: {
            unlockAny,
            unlockAll,
        },
    };
};
