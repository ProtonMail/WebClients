export const BOOKING_SLOT_ID = 'booking-slot-' as const;
export const TEMPORARY_BOOKING_SLOT = 'temporary-booking-slot-' as const;
export const MAX_BOOKING_SLOTS = 100 as const;
export const DEFAULT_EVENT_DURATION = 30;

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
    summary: string;
    description?: string;
    selectedCalendar: string | null;
    duration: number;
    timezone: string | undefined;
    locationType: BookingLocation;
    location?: string;
    bookingSlots: Slot[];
}

export enum BookingFormValidationReasons {
    TIME_SLOT_LIMIT = 'TIME_SLOT_LIMIT',
    TIME_SLOT_REQUIRED = 'NO_TIME_SLOT',
    TITLE_REQUIRED = 'TITLE_REQUIRED',
}

export type BookingFormValidation =
    | {
          type: 'error';
          reason: BookingFormValidationReasons;
          message: string;
      }
    | {
          type: 'warning';
          reason: BookingFormValidationReasons;
      };
