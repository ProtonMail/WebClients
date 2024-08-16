import { ACCENT_COLORS } from '../colors';
import { BASE_SIZE } from '../helpers/size';

export const MAX_CALENDARS_FREE = 3;
export const MAX_CALENDARS_PAID = 25; // Only paid mail
export const MAX_CALENDARS_FAMILY = 150;
export const MAX_CALENDARS_DUO = 50;

export const MAX_DEFAULT_NOTIFICATIONS = 5;
export const MAX_NOTIFICATIONS = 10;
export const MAX_ATTENDEES = 100;
export const MAX_CALENDAR_MEMBERS = 49;
export const MAX_LINKS_PER_CALENDAR = 5;

export enum CALENDAR_CARD_TYPE {
    CLEAR_TEXT = 0,
    ENCRYPTED = 1,
    SIGNED = 2,
    ENCRYPTED_AND_SIGNED = 3,
}

export enum CALENDAR_PERMISSIONS {
    SUPER_OWNER = 1,
    OWNER = 2,
    ADMIN = 4,
    READ_MEMBER_LIST = 8,
    WRITE = 16,
    READ = 32,
    AVAILABILITY = 64,
}

export enum ATTENDEE_PERMISSIONS {
    SEE = 1,
    INVITE = 2,
    SEE_AND_INVITE = 3,
    EDIT = 4,
    DELETE = 8,
}

export const DEFAULT_ATTENDEE_PERMISSIONS = ATTENDEE_PERMISSIONS.SEE;

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

export enum CALENDAR_TYPE {
    PERSONAL = 0,
    SUBSCRIPTION = 1,
    HOLIDAYS = 2,
}

export enum CALENDAR_STATUS {
    ACTIVE = 1,
    DELETED = 2,
}

export enum CALENDAR_DISPLAY {
    HIDDEN = 0,
    VISIBLE = 1,
}

export enum CALENDAR_SHARE_BUSY_TIME_SLOTS {
    NO = 0,
    YES = 1,
}

export enum ICAL_CALSCALE {
    GREGORIAN = 'GREGORIAN',
}

export enum ICAL_METHOD {
    PUBLISH = 'PUBLISH',
    REQUEST = 'REQUEST',
    REPLY = 'REPLY',
    CANCEL = 'CANCEL',
    COUNTER = 'COUNTER',
    DECLINECOUNTER = 'DECLINECOUNTER',
    ADD = 'ADD',
    REFRESH = 'REFRESH',
}

export const ICAL_METHODS_ATTENDEE = [ICAL_METHOD.REPLY, ICAL_METHOD.COUNTER, ICAL_METHOD.REFRESH];
export const ICAL_METHODS_ORGANIZER = [
    ICAL_METHOD.REQUEST,
    ICAL_METHOD.CANCEL,
    ICAL_METHOD.ADD,
    ICAL_METHOD.DECLINECOUNTER,
];

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

export enum ICAL_ALARM_ACTION {
    DISPLAY = 'DISPLAY',
    EMAIL = 'EMAIL',
    AUDIO = 'AUDIO',
}

export enum ATTENDEE_STATUS_API {
    NEEDS_ACTION = 0,
    TENTATIVE = 1,
    DECLINED = 2,
    ACCEPTED = 3,
}

export const MAX_ICAL_SEQUENCE = 2 ** 31;

export const MAX_CHARS_API = {
    UID: 191,
    CALENDAR_NAME: 100,
    CALENDAR_DESCRIPTION: 255,
    TITLE: 255,
    EVENT_DESCRIPTION: 3000,
    LOCATION: 255,
};

export const MAX_CHARS_CLEARTEXT = {
    PURPOSE: 500,
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

export const DEFAULT_CALENDAR = {
    name: 'My calendar',
    color: ACCENT_COLORS[0],
    description: '',
};

export enum VIEWS {
    DAY = 1,
    WEEK,
    MONTH,
    YEAR,
    AGENDA,
    CUSTOM,
    MAIL,
    DRIVE,

    SEARCH,
}

export enum ACTION_VIEWS {
    VIEW = 'VIEW',
}

export enum NOTIFICATION_WHEN {
    BEFORE = '-',
    AFTER = '',
}

export enum NOTIFICATION_UNITS {
    WEEK = 1,
    DAY = 2,
    HOUR = 3,
    MINUTE = 4,
}

export const NOTIFICATION_UNITS_MAX = {
    [NOTIFICATION_UNITS.WEEK]: 1000 - 1,
    [NOTIFICATION_UNITS.DAY]: 7000 - 1,
    [NOTIFICATION_UNITS.HOUR]: 1000 - 1,
    [NOTIFICATION_UNITS.MINUTE]: 10000 - 1,
};

export const DEFAULT_EVENT_DURATION = 30;

export const COLORS = {
    BLACK: '#000',
    WHITE: '#FFF',
};

export enum SAVE_CONFIRMATION_TYPES {
    SINGLE = 1,
    RECURRING,
}

export enum DELETE_CONFIRMATION_TYPES {
    SINGLE = 1,
    RECURRING,
}

export enum RECURRING_TYPES {
    ALL = 1,
    FUTURE,
    SINGLE,
}

export const MAX_IMPORT_EVENTS = 15000;
export const MAX_IMPORT_EVENTS_STRING = MAX_IMPORT_EVENTS.toLocaleString();
export const MAX_IMPORT_FILE_SIZE = 10 * BASE_SIZE ** 2;
export const MAX_IMPORT_FILE_SIZE_STRING = '10 MB';
export const MAX_UID_CHARS_DISPLAY = 43;
export const MAX_FILENAME_CHARS_DISPLAY = 100;
export const IMPORT_CALENDAR_FAQ_URL = '/how-to-import-calendar-to-proton-calendar';
export const IMPORT_CALENDAR_UNSUPPORTED_FAQ_URL = `${IMPORT_CALENDAR_FAQ_URL}/#data-not-supported`;

export const TITLE_INPUT_ID = 'event-title-input';
export const FREQUENCY_INPUT_ID = 'event-frequency-input';
export const LOCATION_INPUT_ID = 'event-location-input';
export const NOTIFICATION_INPUT_ID = 'event-notification-input';
export const CALENDAR_INPUT_ID = 'event-calendar-input';
export const DESCRIPTION_INPUT_ID = 'event-description-input';
export const DATE_INPUT_ID = 'event-date-input';
export const PARTICIPANTS_INPUT_ID = 'event-participants-input';
export const MEMBERS_INPUT_ID = 'shared-members-input';

export enum IMPORT_ERROR_TYPE {
    NO_FILE_SELECTED,
    NO_ICS_FILE,
    FILE_EMPTY,
    FILE_TOO_BIG,
    FILE_CORRUPTED,
    INVALID_CALENDAR,
    INVALID_METHOD,
    NO_EVENTS,
    TOO_MANY_EVENTS,
}

export const SHARED_SIGNED_FIELDS = [
    'uid',
    'dtstamp',
    'dtstart',
    'dtend',
    'recurrence-id',
    'rrule',
    'exdate',
    'organizer',
    'sequence',
] as const;
export const SHARED_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'created', 'description', 'summary', 'location'] as const;

export const CALENDAR_SIGNED_FIELDS = ['uid', 'dtstamp', 'exdate', 'status', 'transp'] as const;
export const CALENDAR_ENCRYPTED_FIELDS = ['uid', 'dtstamp', 'comment'] as const;

export const USER_SIGNED_FIELDS = ['uid', 'dtstamp'] as const;
export const USER_ENCRYPTED_FIELDS = [] as const;

export const ATTENDEES_SIGNED_FIELDS = [] as const;
export const ATTENDEES_ENCRYPTED_FIELDS = ['uid', 'attendee'] as const;

export const REQUIRED_SET = new Set(['uid', 'dtstamp'] as const);

// Set of taken keys to put the rest
export const TAKEN_KEYS = [
    ...new Set([
        ...SHARED_SIGNED_FIELDS,
        ...SHARED_ENCRYPTED_FIELDS,
        ...CALENDAR_SIGNED_FIELDS,
        ...CALENDAR_ENCRYPTED_FIELDS,
        ...USER_SIGNED_FIELDS,
        ...USER_ENCRYPTED_FIELDS,
        ...ATTENDEES_ENCRYPTED_FIELDS,
        ...ATTENDEES_SIGNED_FIELDS,
    ]),
] as const;

export enum NOTIFICATION_TYPE_API {
    EMAIL = 0,
    DEVICE = 1,
}

export enum EVENT_VERIFICATION_STATUS {
    SUCCESSFUL = 1,
    NOT_VERIFIED = 0,
    FAILED = -1,
}

export enum SETTINGS_VIEW {
    DAY = 0,
    WEEK = 1,
    MONTH = 2,
    YEAR = 3,
    PLANNING = 4,
}

export enum CALENDAR_VALIDATION_MODE {
    DOWNLOAD_ONLY = 0,
    DOWNLOAD_AND_PARSE = 1,
}

export const CALENDAR_SETTINGS_ROUTE = {
    GENERAL: '/general',
    CALENDARS: '/calendars',
    INTEROPS: '/import-export',
    GET_APPS: '/get-the-apps',
};

export const CALENDAR_SETTINGS_SECTION_ID = {
    TIME_ZONE: 'time-zone',
    LAYOUT: 'layout',
    INVITATIONS: 'invitations',
    THEME: 'theme',
    PERSONAL_CALENDARS: 'my-calendars',
    OTHER_CALENDARS: 'other-calendars',
    IMPORT: 'import',
    EXPORT: 'export',
    SHARE: 'share',
    SHARE_PRIVATELY: 'share-privately',
    SHARE_PUBLICLY: 'share-publicly',
    MOBILE_APP: 'mobile-app',
    DESKTOP_APP: 'desktop-app',
};

/** Visual limit of the attendees busy slots we display */
export const BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED = 10;
