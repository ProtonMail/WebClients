export const DEFAULT_CALENDAR = {
    name: 'My calendar',
    color: '#657ee4',
    description: ''
};

export const SETTINGS_VIEW = {
    DAY: 0,
    WEEK: 1,
    MONTH: 2,
    YEAR: 3,
    PLANNING: 4
};

export const SETTINGS_WEEK_START = {
    MONDAY: 1,
    SATURDAY: 6,
    SUNDAY: 7
};

export const VIEWS = {
    DAY: 1,
    WEEK: 2,
    MONTH: 3,
    YEAR: 4,
    AGENDA: 5,
    CUSTOM: 6
};

export const DAY_TO_NUMBER = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6
};

export const NUMBER_TO_DAY = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA'
};

export const MINUTE = 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;

export const SETTINGS_DATE_FORMAT = {
    DDMMYYYY: 0,
    MMDDYYYY: 1,
    YYYYMMDD: 2
};

export const SETTINGS_TIME_FORMAT = {
    H24: 0,
    H12: 1
};

export const NOTIFICATION_WHEN = {
    BEFORE: '-',
    AFTER: ''
};

export const NOTIFICATION_TYPE = {
    EMAIL: 0,
    DEVICE: 1
};

export const NOTIFICATION_UNITS = {
    WEEK: 1,
    DAY: 2,
    HOURS: 3,
    MINUTES: 4
};

export const NOTIFICATION_UNITS_MAX = {
    [NOTIFICATION_UNITS.WEEK]: 1000,
    [NOTIFICATION_UNITS.DAY]: 7000,
    [NOTIFICATION_UNITS.HOURS]: 1000,
    [NOTIFICATION_UNITS.MINUTES]: 10000
};

export const FREQUENCY = {
    ONCE: 'ONCE',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
    CUSTOM: 'CUSTOM'
};

export const FREQUENCY_INTERVALS_MAX = {
    [FREQUENCY.DAILY]: 1000,
    [FREQUENCY.WEEKLY]: 5000,
    [FREQUENCY.MONTHLY]: 1000,
    [FREQUENCY.YEARLY]: 100
};

export const FREQUENCY_COUNT_MAX = 50;

export const MAX_CALENDARS_PER_USER = 10;

export const DAILY_TYPE = {
    ALL_DAYS: 0
};

export const WEEKLY_TYPE = {
    ON_DAYS: 0
};

export const MONTHLY_TYPE = {
    ON_MONTH_DAY: 0,
    ON_NTH_DAY: 1,
    ON_MINUS_NTH_DAY: -1
};

export const YEARLY_TYPE = {
    BY_MONTH_ON_MONTH_DAY: 0
};

export const END_TYPE = {
    NEVER: 'NEVER',
    AFTER_N_TIMES: 'COUNT',
    UNTIL: 'UNTIL'
};

export const DEFAULT_EVENT_DURATION = 30;

export const COLORS = {
    BLACK: '#000',
    WHITE: '#FFF'
};

export const MAX_LENGTHS = {
    CALENDAR_NAME: 100,
    TITLE: 255,
    DESCRIPTION: 255,
    LOCATION: 255
};

export const MAX_DEFAULT_NOTIFICATIONS = 5;

export const RECURRING_DELETE_TYPES = {
    ALL: 1,
    FUTURE: 2,
    SINGLE: 3
};
