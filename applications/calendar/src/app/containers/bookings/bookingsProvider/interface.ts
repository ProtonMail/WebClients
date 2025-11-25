import type { LayoutEvent } from '../../../components/calendar/layout';
import type { BookingPageEditData, InternalBookingPage } from '../../../store/internalBooking/interface';
import type { CalendarViewEvent } from '../../calendar/interface';

export const BOOKING_SLOT_ID = 'booking-slot-' as const;
export const TEMPORARY_BOOKING_SLOT = 'temporary-booking-slot-' as const;
export const MAX_BOOKING_SLOTS = 100 as const;
export const DEFAULT_EVENT_DURATION = 30;
export const DEFAULT_RANGE_START_HOUR = 9;
export const DEFAULT_RANGE_END_HOUR = 17;
export const DEFAULT_RECURRING = true;

export interface BookingsContextValue {
    submitForm: () => Promise<void>;
    bookingsState: BookingState;
    isBookingActive: boolean;
    canCreateBooking: boolean;
    openBookingSidebarCreation: (date: Date) => void;
    openBookingSidebarEdition: (bookingPage: InternalBookingPage, editData: BookingPageEditData) => void;
    closeBookingSidebar: () => void;
    formData: BookingFormData;
    updateFormData: (field: keyof InternalBookingFrom, value: any, date?: Date) => void;
    loading: boolean;
    addBookingRange: (data: Omit<BookingRange, 'id'>) => void;
    updateBookingRange: (id: string, start: Date, end: Date) => void;
    removeBookingRange: (id: string) => void;
    isIntersectingBookingRange: (start: Date, end: Date) => boolean;
    getRangeAsCalendarViewEvents: (date: Date) => CalendarViewEvent[];
    getRangesAsLayoutEvents: (date: Date, days: Date[]) => { [key: string]: LayoutEvent[] };
}

export interface Intersection {
    start: Date;
    end: Date;
}

export enum BookingLocation {
    MEET = 'Meet',
    IN_PERSON = 'in-person',
}

export enum BookingState {
    OFF = 'OFF',
    CREATE_NEW = 'CREATE_NEW',
    EDIT_EXISTING = 'EDIT_EXISTING',
}

export enum BookingRangeError {
    TOO_SHORT = 'TOO_SHORT',
}

export interface BookingRange {
    id: string;
    start: Date;
    end: Date;
    timezone: string;
    error?: BookingRangeError;
}

// Each slot is associated with a booking range for easy removal
export interface Slot extends BookingRange {
    rangeID: string;
}

export interface RecurringRangeDisplay {
    id: number;
    date: Date;
    ranges: BookingRange[];
}

export interface BookingFormData {
    recurring: boolean;
    summary: string;
    description?: string;
    selectedCalendar: string | null;
    duration: number;
    timezone: string;
    locationType: BookingLocation;
    location?: string;
    bookingSlots: Slot[];
    bookingRanges: BookingRange[];
}

export type InternalBookingFrom = Omit<BookingFormData, 'bookingSlots'>;

export enum BookingFormValidationReasons {
    TIME_SLOT_LIMIT = 'TIME_SLOT_LIMIT',
    TIME_SLOT_REQUIRED = 'NO_TIME_SLOT',
    TITLE_REQUIRED = 'TITLE_REQUIRED',
    RANGE_ERROR = 'RANGE_ERROR',
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
