import type { APIBooking, SerializedFormData } from '../../containers/bookings/bookingsTypes';

export interface VerificationError {
    secretVerificationError: boolean;
    slotVerificationError: boolean;
    contentVerificationError: boolean;
}

export interface InternalBookingPage {
    id: string;
    bookingUID: string;
    calendarID: string;
    summary: string;
    description?: string;
    location?: string;
    withProtonMeetLink: boolean;
    link: string;
    verificationErrors: VerificationError;
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
