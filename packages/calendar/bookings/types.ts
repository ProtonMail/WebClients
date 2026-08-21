export enum BookingLocation {
    MEET = 'Meet',
    OTHER_LOCATION = 'other-location',
}

export enum MinimumNoticeMode {
    OFF = 0,
    TWO_HOURS = 1,
    FORTY_EIGHT_HOURS = 2,
    NOT_SAME_DAY = 3,
}

export interface APISlot {
    ID: string;
    StartTime: number;
    EndTime: number;
    Timezone: string;
    RRule: string | null;
    DetachedSignature: string;
    BookingKeyPacket: string;
    SharedKeyPacket: string;
}

export interface APIBooking {
    ID: string;
    CalendarID: string;
    BookingUID: string;
    BookingKeySalt: string;
    EncryptedSecret: string;
    EncryptedContent: string;
    CreateTime: number;
    ModifyTime: number;
    Slots: APISlot[];
    MinimumNoticeMode: MinimumNoticeMode;
    ConflictCalendarIDs: string[];
}

export interface SerializedBookingRange {
    id: string;
    start: number;
    end: number;
    timezone: string;
}

export interface SerializedSlot extends SerializedBookingRange {
    rangeID: string;
}

export interface SerializedFormData {
    recurring: boolean;
    summary: string;
    description?: string;
    selectedCalendar: string | null;
    duration: number;
    timezone: string;
    locationType: BookingLocation;
    location?: string;
    bookingSlots: SerializedSlot[];
    bookingRanges: SerializedBookingRange[];
    minimumNoticeMode: MinimumNoticeMode;
    conflictCalendarIDs: string[];
}

export interface EditSlotData {
    start: number;
    end: number;
    timezone: string;
    rrule: string | null;
}

export interface BookingPageEditData {
    slots: EditSlotData[];
    bookingUID: string;
    encryptedSecret: string;
    encryptedContent: string;
    bookingKeySalt: string;
    minimumNoticeMode: MinimumNoticeMode;
    conflictCalendarIDs: string[];
}
