import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { CALENDAR_FLAGS } from 'proton-shared/lib/calendar/constants';

const RESET_MASK = CALENDAR_FLAGS.RESET_NEEDED | CALENDAR_FLAGS.INCOMPLETE_SETUP | CALENDAR_FLAGS.UPDATE_PASSPHRASE;

export enum SETUP_TYPE {
    DONE,
    WELCOME,
    RESET,
}

export const getSetupType = (calendars: Calendar[] = []) => {
    const isNoCalendarSetup = calendars.length === 0;
    if (isNoCalendarSetup) {
        return SETUP_TYPE.WELCOME;
    }

    const hasCalendarsToReset = calendars.some(({ Flags }) => {
        return (Flags & RESET_MASK) > 0;
    });
    if (hasCalendarsToReset) {
        return SETUP_TYPE.RESET;
    }

    return SETUP_TYPE.DONE;
};
