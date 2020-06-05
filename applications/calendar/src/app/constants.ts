import { BASE_SIZE } from 'proton-shared/lib/constants';

export const DEFAULT_CALENDAR = {
    name: 'My calendar',
    color: '#657ee4',
    description: '',
};

export enum VIEWS {
    DAY = 1,
    WEEK,
    MONTH,
    YEAR,
    AGENDA,
    CUSTOM,
}

export const MINUTE = 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;

export enum NOTIFICATION_WHEN {
    BEFORE = '-',
    AFTER = '',
}

export enum NOTIFICATION_UNITS {
    WEEK = 1,
    DAY = 2,
    HOURS = 3,
    MINUTES = 4,
}

export const NOTIFICATION_UNITS_MAX = {
    [NOTIFICATION_UNITS.WEEK]: 1000 - 1,
    [NOTIFICATION_UNITS.DAY]: 7000 - 1,
    [NOTIFICATION_UNITS.HOURS]: 1000 - 1,
    [NOTIFICATION_UNITS.MINUTES]: 10000 - 1,
};

export enum FREQUENCY {
    ONCE = 'ONCE',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    CUSTOM = 'CUSTOM',
}

export const FREQUENCY_INTERVALS_MAX = {
    [FREQUENCY.ONCE]: 1000 - 1,
    [FREQUENCY.DAILY]: 1000 - 1,
    [FREQUENCY.WEEKLY]: 5000 - 1,
    [FREQUENCY.MONTHLY]: 1000 - 1,
    [FREQUENCY.YEARLY]: 100 - 1,
    [FREQUENCY.CUSTOM]: 1000 - 1,
};

export const FREQUENCY_COUNT_MAX = 50 - 1;

export const MAX_CALENDARS_PER_USER = 10;

export enum DAILY_TYPE {
    ALL_DAYS = 0,
}

export enum WEEKLY_TYPE {
    ON_DAYS = 0,
}

export enum MONTHLY_TYPE {
    ON_MONTH_DAY = 0,
    ON_NTH_DAY = 1,
    ON_MINUS_NTH_DAY = -1,
}

export enum YEARLY_TYPE {
    BY_MONTH_ON_MONTH_DAY = 0,
}

export enum END_TYPE {
    NEVER = 'NEVER',
    AFTER_N_TIMES = 'COUNT',
    UNTIL = 'UNTIL',
}

export const DEFAULT_EVENT_DURATION = 30;

export const COLORS = {
    BLACK: '#000',
    WHITE: '#FFF',
};

export const MAX_LENGTHS = {
    UID: 191,
    CALENDAR_NAME: 100,
    CALENDAR_DESCRIPTION: 255,
    TITLE: 255,
    EVENT_DESCRIPTION: 3000,
    LOCATION: 255,
};

export const MAX_DEFAULT_NOTIFICATIONS = 5;
export const MAX_NOTIFICATIONS = 10;

export enum SAVE_CONFIRMATION_TYPES {
    SINGLE = 1,
    RECURRING,
}

export enum DELETE_CONFIRMATION_TYPES {
    SINGLE = 1,
    RECURRING,
    ALL_RECURRING,
}

export enum RECURRING_TYPES {
    ALL = 1,
    FUTURE,
    SINGLE,
}

export const MINIMUM_DATE = new Date(1970, 0, 1);
export const MINIMUM_DATE_UTC = new Date(
    Date.UTC(MINIMUM_DATE.getFullYear(), MINIMUM_DATE.getMonth(), MINIMUM_DATE.getDate())
);

export const MAXIMUM_DATE = new Date(2037, 11, 31);
export const MAXIMUM_DATE_UTC = new Date(
    Date.UTC(MAXIMUM_DATE.getFullYear(), MAXIMUM_DATE.getMonth(), MAXIMUM_DATE.getDate())
);

export const MAX_IMPORT_EVENTS = 15000;
export const MAX_IMPORT_EVENTS_STRING = "15'000";
export const MAX_IMPORT_FILE_SIZE = 10 * BASE_SIZE ** 2;
export const MAX_IMPORT_FILE_SIZE_STRING = '10 MB';
export const MAX_UID_CHARS_DISPLAY = 43;
export const MAX_FILENAME_CHARS_DISPLAY = 100;
