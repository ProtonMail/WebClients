export const BOOKING_SLOT_ID = 'booking-slot-' as const;
export const TEMPORARY_BOOKING_SLOT = 'temporary-booking-slot-' as const;
export const MAX_BOOKING_SLOTS = 100 as const;

export enum BookingLocation {
    MEET = 'Meet',
    IN_PERSON = 'in-person',
}

export enum BookingState {
    OFF = 'OFF',
    CREATE_NEW = 'CREATE_NEW',
    EDIT_EXISTING = 'EDIT_EXISTING',
}

export interface BookingRange {
    id: string;
    start: Date;
    end: Date;
    timezone: string;
}

// Each slot is associated with a booking range for easy removal
export interface Slot extends BookingRange {
    rangeID: string;
}

export interface BookingFormData {
    title: string;
    description?: string;
    selectedCalendar: string | null;
    duration: number;
    timezone: string | undefined;
    locationType: BookingLocation;
    location?: string;
    password?: string;
    bookingSlots: Slot[];
}

export type BookingFormValidation =
    | {
          type: 'error';
          message: string;
      }
    | {
          type: 'warning';
      };
