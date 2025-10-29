export interface BookingPageSlotsPayload {
    StartTime: number;
    EndTime: number;
    Timezone: string;
    RRule: string | null;
    DetachedSignature: string;
    BookingKeyPacket: string;
    SharedKeyPacket: string;
}

export interface BookingPageCreationPayload {
    CalendarID: string;
    BookingUID: string;
    BookingKeySalt: string;
    EncryptedSecret: string;
    EncryptedContent: string;
    Slots: BookingPageSlotsPayload[];
}
