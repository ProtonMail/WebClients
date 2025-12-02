import type { BookingLocation } from './interface';

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
}
