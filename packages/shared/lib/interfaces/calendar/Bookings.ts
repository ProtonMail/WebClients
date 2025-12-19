export interface BookingPageSlotsPayload {
    StartTime: number;
    EndTime: number;
    Timezone: string;
    RRule: string | null;
    DetachedSignature: string;
}

export interface BookingPageCreationPayload {
    CalendarID: string;
    BookingUID: string;
    BookingKeySalt: string;
    EncryptedSecret: string;
    EncryptedContent: string;
    CalendarKeySignature: string;
    Slots: BookingPageSlotsPayload[];
}

export interface BookingPageEditPayload {
    EncryptedContent: string;
    EncryptedSecret: string;
    CalendarKeySignature: string;
    Slots: BookingPageSlotsPayload[];
}

export interface ExternalBookingPageSlotsPayload {
    ID: string;
    StartTime: number;
    EndTime: number;
    Timezone: string;
    RRule: string | null;
    DetachedSignature: string;
    BookingKeyPacket: string;
}

export interface ExternalBookingPagePayload {
    CalendarID: string;
    BookingUID: string;
    BookingKeySalt: string;
    EncryptedContent: string;
    Duration: number | null;
    Timezone: string | null;
    DisplayName: string;
    Email: string;
    AvailableSlots: ExternalBookingPageSlotsPayload[];
}

export interface InternalBookingPagePayload {
    ID: string;
    CalendarID: string;
    BookingUID: string;
    BookingKeySalt: string;
    EncryptedSecret: string;
    EncryptedContent: string;
    CreateTime: number;
    ModifyTime: number;
}

// V1 Crypto model
export interface OldBookingSlotConfirmationPayload {
    ContentPart: string;
    TimePart: string;
    AttendeeData: string;
    AttendeeToken: string;
    AttendeeSharedKeyPacket?: string;
    EmailData: {
        Name: string;
        Email: string;
        Subject: string;
        Body: string;
        Ics: string;
        Type: 'external'; // TODO always use external for now, but we might want to do E2EE confirmation mail for logged-in users later
    };
}
