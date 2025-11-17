import { areIntervalsOverlapping, isBefore } from 'date-fns';
import { c } from 'ttag';

import { fromUTCDateToLocalFakeUTCDate, getTimezone } from '@proton/shared/lib/date/timezone';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { CalendarBootstrap, CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import type { BookingRange, InternalBookingFrom, Slot } from '../../bookingsProvider/interface';
import { BookingLocation, DEFAULT_EVENT_DURATION } from '../../bookingsProvider/interface';
import { generateDefaultBookingRange } from '../range/rangeHelpers';
import { generateSlotsFromRange } from '../slot/slotHelpers';

export const getInitialBookingFormState = (): InternalBookingFrom => {
    const localTimeZone = getTimezone();

    return {
        summary: '',
        selectedCalendar: null,
        locationType: BookingLocation.MEET,
        duration: DEFAULT_EVENT_DURATION,
        timezone: localTimeZone,
        bookingRanges: [],
    };
};

export const recomputeSlotsForRanges = (bookingRanges: BookingRange[] | null, newDuration: number): Slot[] => {
    if (!bookingRanges) {
        return [];
    }

    const newSlots: Slot[] = [];
    bookingRanges.forEach((range) => {
        const slots = generateSlotsFromRange({
            rangeID: range.id,
            start: range.start,
            end: range.end,
            duration: newDuration,
            timezone: range.timezone,
        });

        newSlots.push(...slots);
    });

    return newSlots;
};

export const computeInitialFormData = ({
    userSettings,
    calendarUserSettings,
    calendarBootstrap,
    currentUTCDate,
    preferredCalendarID,
}: {
    userSettings: UserSettings;
    calendarUserSettings?: CalendarUserSettings;
    calendarBootstrap?: CalendarBootstrap;
    currentUTCDate: Date;
    preferredCalendarID: string;
}): InternalBookingFrom => {
    const timezone = calendarUserSettings?.PrimaryTimezone || calendarUserSettings?.SecondaryTimezone || getTimezone();

    const duration = calendarBootstrap?.CalendarSettings.DefaultEventDuration || DEFAULT_EVENT_DURATION;
    const bookingRanges = generateDefaultBookingRange(userSettings, currentUTCDate, timezone, false);

    return {
        summary: '',
        selectedCalendar: preferredCalendarID,
        locationType: BookingLocation.MEET,
        duration,
        timezone,
        bookingRanges,
    };
};

export const validateRangeOperation = ({
    operation,
    start,
    end,
    timezone,
    rangeId,
    existingRanges,
    excludeRangeId,
}: {
    operation: 'add' | 'update';
    start: Date;
    end: Date;
    timezone: string;
    rangeId: string;
    existingRanges: BookingRange[];
    excludeRangeId?: string;
}): string | null => {
    // Check if trying to add/update in the past
    if (operation === 'add') {
        const now = new Date();
        const nowWithTz = fromUTCDateToLocalFakeUTCDate(now, false, timezone);

        if (isBefore(start, nowWithTz)) {
            return c('Info').t`Booking cannot be added in the past.`;
        }
    }

    for (const range of existingRanges) {
        if (excludeRangeId && range.id === excludeRangeId) {
            continue;
        }

        if (range.id === rangeId) {
            return c('Info').t`Booking already exists.`;
        }

        if (areIntervalsOverlapping({ start, end }, { start: range.start, end: range.end })) {
            return c('Info').t`Booking overlaps with an existing booking.`;
        }
    }

    return null;
};

const hasBookingRangesChanged = (currentRanges: BookingRange[] | null, initialRanges?: BookingRange[]): boolean => {
    if (!initialRanges) {
        return (currentRanges?.length ?? 0) > 0;
    }

    if ((currentRanges?.length ?? 0) !== initialRanges.length) {
        return true;
    }

    if (!currentRanges) {
        return false;
    }

    const currentRangeIds = new Set(currentRanges.map((range) => range.id));
    const initialRangeIds = new Set(initialRanges.map((range) => range.id));

    if (currentRangeIds.size !== initialRangeIds.size) {
        return true;
    }

    return false;
};

export const wasBookingFormTouched = ({
    currentFormData,
    initialFormData,
}: {
    currentFormData: InternalBookingFrom;
    initialFormData: InternalBookingFrom | undefined;
}): boolean => {
    if (!initialFormData) {
        return false;
    }

    if (
        currentFormData.summary !== initialFormData.summary ||
        currentFormData.description !== initialFormData.description ||
        currentFormData.duration !== initialFormData.duration ||
        currentFormData.selectedCalendar !== initialFormData.selectedCalendar ||
        currentFormData.location !== initialFormData.location ||
        currentFormData.locationType !== initialFormData.locationType
    ) {
        return true;
    }

    if (hasBookingRangesChanged(currentFormData.bookingRanges, initialFormData.bookingRanges)) {
        return true;
    }

    return false;
};
