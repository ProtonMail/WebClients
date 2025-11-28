import type {
    BookingPageEditData,
    InternalBookingPage,
} from 'applications/calendar/src/app/store/internalBooking/interface';
import { areIntervalsOverlapping, differenceInMinutes, isBefore } from 'date-fns';
import { c } from 'ttag';

import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { fromUTCDateToLocalFakeUTCDate, getTimezone } from '@proton/shared/lib/date/timezone';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type {
    CalendarBootstrap,
    CalendarUserSettings,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar/Calendar';

import type { BookingRange, InternalBookingFrom, Slot } from '../../bookingsProvider/interface';
import { BookingLocation, DEFAULT_EVENT_DURATION, DEFAULT_RECURRING } from '../../bookingsProvider/interface';
import { generateDefaultBookingRange, generateRangeFromSlots } from '../range/rangeHelpers';
import { generateSlotsFromRange } from '../slot/slotHelpers';
import { fromTimestampToUTCDate } from '../timeHelpers';

export const getInitialBookingFormState = (isRecurringEnabled: boolean): InternalBookingFrom => {
    const localTimeZone = getTimezone();

    return {
        recurring: isRecurringEnabled ? DEFAULT_RECURRING : false,
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
            duration: newDuration === 0 ? DEFAULT_EVENT_DURATION : newDuration,
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
    recurring,
    isMeetVideoConferenceEnabled,
}: {
    userSettings: UserSettings;
    calendarUserSettings?: CalendarUserSettings;
    calendarBootstrap?: CalendarBootstrap;
    currentUTCDate: Date;
    preferredCalendarID: string;
    recurring: boolean;
    isMeetVideoConferenceEnabled: boolean;
}): InternalBookingFrom => {
    const timezone = calendarUserSettings?.PrimaryTimezone || calendarUserSettings?.SecondaryTimezone || getTimezone();

    const duration = calendarBootstrap?.CalendarSettings.DefaultEventDuration || DEFAULT_EVENT_DURATION;
    const bookingRanges = generateDefaultBookingRange(userSettings, currentUTCDate, timezone, recurring);

    return {
        recurring,
        summary: '',
        selectedCalendar: preferredCalendarID,
        locationType: isMeetVideoConferenceEnabled ? BookingLocation.MEET : BookingLocation.IN_PERSON,
        duration,
        timezone,
        bookingRanges,
    };
};

export const getBookingPageCalendar = ({
    writeableCalendars,
    bookingPage,
}: {
    writeableCalendars: VisualCalendar[];
    bookingPage: InternalBookingPage;
}): VisualCalendar | undefined => {
    const bookingCalendar = writeableCalendars.find((calendar) => calendar.ID === bookingPage.calendarID);
    const isCalendarDisabled = !bookingCalendar || getIsCalendarDisabled(bookingCalendar);
    const selectedCalendar = isCalendarDisabled
        ? writeableCalendars.find((calendar) => !getIsCalendarDisabled(calendar))
        : bookingCalendar;

    return selectedCalendar;
};

const getEditBookingPageTimezone = ({
    bookingPageTimezone,
    calendarPrimaryTimezone,
}: {
    bookingPageTimezone?: string;
    calendarPrimaryTimezone?: string;
}): string => {
    if (bookingPageTimezone && !calendarPrimaryTimezone) {
        return bookingPageTimezone;
    }

    if (bookingPageTimezone && calendarPrimaryTimezone) {
        return bookingPageTimezone !== calendarPrimaryTimezone ? calendarPrimaryTimezone : bookingPageTimezone;
    }

    return getTimezone();
};

export const computeEditFormData = ({
    bookingPageCalendar,
    bookingPage,
    editData,
    isMeetVideoConferenceEnabled,
    calendarUserSettings,
}: {
    bookingPageCalendar: VisualCalendar;
    bookingPage: InternalBookingPage;
    editData: BookingPageEditData;
    isMeetVideoConferenceEnabled: boolean;
    calendarUserSettings?: CalendarUserSettings;
}): InternalBookingFrom => {
    const firstSlot = editData.slots[0];

    const timezone = getEditBookingPageTimezone({
        bookingPageTimezone: firstSlot.timezone,
        calendarPrimaryTimezone: calendarUserSettings?.PrimaryTimezone,
    });

    const duration = firstSlot
        ? differenceInMinutes(
              fromTimestampToUTCDate(firstSlot.end, firstSlot.timezone),
              fromTimestampToUTCDate(firstSlot.start, firstSlot.timezone)
          )
        : DEFAULT_EVENT_DURATION;

    const recurring = firstSlot ? !!firstSlot.rrule : DEFAULT_RECURRING;
    const ranges = generateRangeFromSlots(editData, timezone);

    const locationType = bookingPage.withProtonMeetLink ? BookingLocation.MEET : BookingLocation.IN_PERSON;

    return {
        summary: bookingPage.summary,
        description: bookingPage.description,
        selectedCalendar: bookingPageCalendar.ID,
        locationType: isMeetVideoConferenceEnabled ? locationType : BookingLocation.IN_PERSON,
        location: isMeetVideoConferenceEnabled && bookingPage.withProtonMeetLink ? undefined : bookingPage.location,
        timezone: timezone,
        recurring,
        duration,
        bookingRanges: ranges,
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
    recurring,
}: {
    operation: 'add' | 'update';
    start: Date;
    end: Date;
    timezone: string;
    rangeId: string;
    existingRanges: BookingRange[];
    excludeRangeId?: string;
    recurring: boolean;
}): string | null => {
    // Check if trying to add/update in the past, not relevant for recurring bookings
    if (operation === 'add' && !recurring) {
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

    for (const id of currentRangeIds) {
        if (!initialRangeIds.has(id)) {
            return true;
        }
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
        currentFormData.locationType !== initialFormData.locationType ||
        currentFormData.recurring !== initialFormData.recurring
    ) {
        return true;
    }

    if (hasBookingRangesChanged(currentFormData.bookingRanges, initialFormData.bookingRanges)) {
        return true;
    }

    return false;
};
