import type { APIBooking, SerializedFormData } from '../../containers/bookings/bookingsTypes';

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
    rrule: string | null;
}

export interface BookingPageEditData {
    slots: EditSlotData[];
    bookingId: string;
    encryptedSecret: string;
    encryptedContent: string;
    bookingKeySalt: string;
}

export interface InternalBookingPageSliceInterface {
    bookingPages: InternalBookingPage[];
    bookingPageEditData?: BookingPageEditData;
}

export interface BookingPageCreationReturn {
    bookingLink: string;
    bookingPage: APIBooking;
    initialBookingPage: SerializedFormData;
}

export interface BookingPageEditionReturn {
    bookingPage: APIBooking;
    initialBookingPage: SerializedFormData;
}
