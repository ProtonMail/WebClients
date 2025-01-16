import { SETTINGS_VIEW } from '@proton/shared/lib/calendar/constants';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';

export const getCalendarArrayLength = (arr?: any[]) => {
    if (!arr) {
        return '0';
    }

    if (arr.length < 10) {
        return arr.length.toString();
    }

    if (arr.length < 20) {
        return '10-19';
    }

    if (arr.length < 25) {
        return '20-25';
    }

    return '25+';
};

export const getWeekStart = (weekStart: SETTINGS_WEEK_START) => {
    switch (weekStart) {
        case SETTINGS_WEEK_START.LOCALE_DEFAULT:
            return 'default';
        case SETTINGS_WEEK_START.MONDAY:
            return 'monday';
        case SETTINGS_WEEK_START.TUESDAY:
            return 'tuesday';
        case SETTINGS_WEEK_START.WEDNESDAY:
            return 'wednesday';
        case SETTINGS_WEEK_START.THURSDAY:
            return 'thursday';
        case SETTINGS_WEEK_START.FRIDAY:
            return 'friday';
        case SETTINGS_WEEK_START.SATURDAY:
            return 'saturday';
        case SETTINGS_WEEK_START.SUNDAY:
            return 'sunday';
    }
};

export const getCalendarViewPreference = (viewPreference: SETTINGS_VIEW) => {
    switch (viewPreference) {
        case SETTINGS_VIEW.DAY:
            return 'day';
        case SETTINGS_VIEW.WEEK:
            return 'week';
        case SETTINGS_VIEW.MONTH:
            return 'month';
        case SETTINGS_VIEW.YEAR:
            return 'year';
        case SETTINGS_VIEW.PLANNING:
            return 'planning';
    }
};
