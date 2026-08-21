import type {
    APIBooking,
    BookingPageEditData,
    MinimumNoticeMode,
    SerializedFormData,
} from '@proton/calendar/bookings/types';

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
    minimumNoticeMode: MinimumNoticeMode;
    conflictCalendarIDs: string[];
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
