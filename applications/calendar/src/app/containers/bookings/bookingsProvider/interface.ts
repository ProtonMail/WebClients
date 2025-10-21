export const BOOKING_SLOT_ID = 'booking-slot-' as const;

export enum BookingState {
    OFF = 'OFF',
    CREATE_NEW = 'CREATE_NEW',
    EDIT_EXISTING = 'EDIT_EXISTING',
}

export interface Slot {
    id: string;
    start: Date;
    end: Date;
}

export interface BookingFormData {
    title: string;
    selectedCalendar: string | null;
    duration: number;
    timeZone: string | undefined;
    bookingSlots: Slot[];
}
