export enum CALENDAR_CARD_TYPE {
    ENCRYPTED_AND_SIGNED = 3,
    SIGNED = 2,
    CLEAR = 1,
}

export enum CALENDAR_PERMISSIONS {
    OWNER = 32,
    ADMIN = 16,
    WRITE = 8,
    READ_MEMBER_LIST = 4,
    READ = 2,
    AVAILABILITY = 1,
}

export enum ATTENDEE_PERMISSIONS {
    SEE = 1,
    INVITE = 2,
    SEE_AND_INVITE = 3,
    EDIT = 4,
    DELETE = 8,
}

export enum CALENDAR_FLAGS {
    INACTIVE = 0,
    ACTIVE = 1,
    UPDATE_PASSPHRASE = 2,
    RESET_NEEDED = 4,
    INCOMPLETE_SETUP = 8,
    LOST_ACCESS = 16,
    SELF_DISABLED = 32,
    SUPER_OWNER_DISABLED = 64,
}

export enum ICAL_METHOD {
    REQUEST = 'REQUEST',
    REPLY = 'REPLY',
    CANCEL = 'CANCEL',
    DECLINECOUNTER = 'DECLINECOUNTER',
    REFRESH = 'REFRESH',
    COUNTER = 'COUNTER',
}

export enum ICAL_EVENT_STATUS {
    TENTATIVE = 'TENTATIVE',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
}

export enum ICAL_ATTENDEE_RSVP {
    TRUE = 'TRUE',
    FALSE = 'FALSE',
}

export enum ICAL_ATTENDEE_ROLE {
    REQUIRED = 'REQ-PARTICIPANT', // Indicates a participant whose participation is required
    OPTIONAL = 'OPT-PARTICIPANT', // Indicates a participant whose participation is optional
    NON = 'NON-PARTICIPANT', // Indicates a participant who is copied for information purposes only
}

export enum ICAL_ATTENDEE_STATUS {
    NEEDS_ACTION = 'NEEDS-ACTION',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    TENTATIVE = 'TENTATIVE',
    DELEGATED = 'DELEGATED',
}

export enum ATTENDEE_STATUS_API {
    NEEDS_ACTION,
    TENTATIVE,
    ACCEPTED,
    DECLINED,
}

export const MAX_CALENDARS_PER_USER = 10;

export const MAX_LENGTHS = {
    UID: 191,
    CALENDAR_NAME: 100,
    CALENDAR_DESCRIPTION: 255,
    TITLE: 255,
    EVENT_DESCRIPTION: 3000,
    LOCATION: 255,
};

export const MINIMUM_DATE = new Date(1970, 0, 1);
export const MINIMUM_DATE_UTC = new Date(
    Date.UTC(MINIMUM_DATE.getFullYear(), MINIMUM_DATE.getMonth(), MINIMUM_DATE.getDate())
);
export const MAXIMUM_DATE = new Date(2037, 11, 31);
export const MAXIMUM_DATE_UTC = new Date(
    Date.UTC(MAXIMUM_DATE.getFullYear(), MAXIMUM_DATE.getMonth(), MAXIMUM_DATE.getDate())
);

export enum FREQUENCY {
    ONCE = 'ONCE',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    CUSTOM = 'CUSTOM',
    OTHER = 'OTHER',
}

export const FREQUENCY_INTERVALS_MAX = {
    [FREQUENCY.ONCE]: 1000 - 1,
    [FREQUENCY.DAILY]: 1000 - 1,
    [FREQUENCY.WEEKLY]: 5000 - 1,
    [FREQUENCY.MONTHLY]: 1000 - 1,
    [FREQUENCY.YEARLY]: 100 - 1,
    [FREQUENCY.CUSTOM]: 1000 - 1,
    [FREQUENCY.OTHER]: 1,
};
export const FREQUENCY_COUNT_MAX = 50 - 1;
export const FREQUENCY_COUNT_MAX_INVITATION = 500 - 1;

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

export const ICAL_EXTENSIONS = ['ics', 'ical', 'ifb', 'icalendar'];
export const ICAL_MIME_TYPE = 'text/calendar';
