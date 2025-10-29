export const BOOKING_SLOT_ID = 'booking-slot-' as const;

export enum BookingLocation {
    MEET = 'Meet',
    IN_PERSON = 'in-person',
}

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
    description: string;
    selectedCalendar: string | null;
    duration: number;
    timezone: string | undefined;
    location: BookingLocation;
    locationType: BookingLocation;
    location?: string;
    password?: string;
    bookingSlots: Slot[];
}
