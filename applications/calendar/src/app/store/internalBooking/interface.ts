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

export interface InternalBookingPageSliceInterface {
    bookingPages: InternalBookingPage[];
}
