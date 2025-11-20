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
