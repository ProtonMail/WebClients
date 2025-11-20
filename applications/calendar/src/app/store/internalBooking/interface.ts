export interface InternalBookingPage {
    id: string;
    bookingUID: string;
    calendarID: string;
    summary: string;
    description?: string;
    location?: string;
    withProtonMeetLink: boolean;
    link: string;
}

export interface EditSlotData {
    start: number;
    end: number;
    timezone: string;
}

export interface BookingPageEditData {
    slots: EditSlotData[];
    bookingId: string;
    encryptedSecret: string;
    encryptedContent: string;
}

export interface InternalBookingPageSliceInterface {
    bookingPages: InternalBookingPage[];
    bookingPageEditData?: BookingPageEditData;
}
