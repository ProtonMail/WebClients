import type {
    BookingPageEditData,
    InternalBookingPage,
} from 'applications/calendar/src/app/store/internalBooking/interface';
import { areIntervalsOverlapping, differenceInMinutes, isBefore, isSameDay, subMinutes } from 'date-fns';

import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { convertUTCDateTimeToZone, fromUTCDate, getTimezone, toLocalDate } from '@proton/shared/lib/date/timezone';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type {
    CalendarBootstrap,
    CalendarUserSettings,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar/Calendar';

import type { BookingRange, InternalBookingFrom, Slot } from '../../interface';
import { BookingLocation, DEFAULT_EVENT_DURATION, DEFAULT_RECURRING } from '../../interface';
import { BookingErrorMessages } from '../bookingCopy';
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
    canUseMeetLocation,
}: {
    userSettings: UserSettings;
    calendarUserSettings?: CalendarUserSettings;
    calendarBootstrap?: CalendarBootstrap;
    currentUTCDate: Date;
    preferredCalendarID: string;
    recurring: boolean;
    canUseMeetLocation: boolean;
}): InternalBookingFrom => {
    const timezone = calendarUserSettings?.PrimaryTimezone || calendarUserSettings?.SecondaryTimezone || getTimezone();

    const duration = calendarBootstrap?.CalendarSettings.DefaultEventDuration || DEFAULT_EVENT_DURATION;
    const bookingRanges = generateDefaultBookingRange(userSettings, currentUTCDate, timezone, recurring);

    // Remove 30 minutes form the end of the booking range for 90 minutes calendars to have full slots
    const fullSlotDuration =
        duration === 90
            ? bookingRanges.map((range) => ({
                  ...range,
                  start: range.start,
                  end: subMinutes(range.end, 30),
              }))
            : bookingRanges;

    return {
        recurring,
        summary: '',
        selectedCalendar: preferredCalendarID,
        locationType: canUseMeetLocation ? BookingLocation.MEET : BookingLocation.IN_PERSON,
        duration,
        timezone,
        bookingRanges: fullSlotDuration,
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
    canUseMeetLocation,
    calendarUserSettings,
}: {
    bookingPageCalendar: VisualCalendar;
    bookingPage: InternalBookingPage;
    editData: BookingPageEditData;
    canUseMeetLocation: boolean;
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
        locationType: canUseMeetLocation ? locationType : BookingLocation.IN_PERSON,
        location: canUseMeetLocation && bookingPage.withProtonMeetLink ? undefined : bookingPage.location,
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
    rangeId,
    existingRanges,
    excludeRangeId,
    recurring,
    timezone,
}: {
    operation: 'add' | 'update';
    start: Date;
    end: Date;
    rangeId: string;
    existingRanges: BookingRange[];
    excludeRangeId?: string;
    recurring: boolean;
    timezone: string;
}): string | null => {
    // Check if invalid duration (this typically happens with overlaps)
    if (recurring && start.getTime() >= end.getTime()) {
        return BookingErrorMessages.RANGE_OVERLAP;
    }

    // Check if trying to add/update in the past, not relevant for recurring bookings
    if (operation === 'add' && !recurring) {
        const nowWithTz = toLocalDate(convertUTCDateTimeToZone(fromUTCDate(new Date()), timezone));

        if (isBefore(start, nowWithTz)) {
            return BookingErrorMessages.RANGE_IN_PAST;
        }
    }

    if (operation === 'add') {
        if (!isSameDay(start, end)) {
            return BookingErrorMessages.RANGE_MULTIPLE_DAYS;
        }
    }

    for (const range of existingRanges) {
        if (excludeRangeId && range.id === excludeRangeId) {
            continue;
        }

        if (range.id === rangeId) {
            return BookingErrorMessages.RANGE_ALREADY_EXIST;
        }

        if (areIntervalsOverlapping({ start, end }, { start: range.start, end: range.end })) {
            return BookingErrorMessages.RANGE_OVERLAP;
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
