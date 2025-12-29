import { addDays, addHours, set, subDays } from 'date-fns';

import type { BookingRange, InternalBookingForm } from '../../interface';
import { BookingLocation } from '../../interface';
import { BookingErrorMessages } from '../bookingCopy';
import { validateRangeOperation, wasBookingFormTouched } from './providerHelper';

const createBookingRange = (overrides: Partial<BookingRange> & { id: string }): BookingRange => ({
    start: new Date('2026-01-20T09:00:00'),
    end: new Date('2026-01-20T17:00:00'),
    timezone: 'Europe/Zurich',
    ...overrides,
});

const createFormData = (overrides: Partial<InternalBookingForm> = {}): InternalBookingForm => ({
    recurring: false,
    summary: 'Test Meeting',
    description: 'Test Description',
    selectedCalendar: 'calendar-1',
    locationType: BookingLocation.MEET,
    duration: 30,
    timezone: 'Europe/Zurich',
    bookingRanges: [],
    conflictCalendarIDs: [],
    ...overrides,
});

describe('Provider helpers', () => {
    describe('validateRangeOperation', () => {
        const futureDate = addDays(new Date(), 7);
        const futureStart = set(futureDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
        const futureEnd = set(futureDate, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });

        it('should return error when adding range spans multiple days', () => {
            const result = validateRangeOperation({
                operation: 'add',
                start: futureStart,
                end: addDays(futureEnd, 1),
                rangeId: 'new-range',
                existingRanges: [],
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_MULTIPLE_DAYS);
        });

        it('should return null when adding range is on single day', () => {
            const result = validateRangeOperation({
                operation: 'add',
                start: futureStart,
                end: futureEnd,
                rangeId: 'new-range',
                existingRanges: [],
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBeNull();
        });

        it('should allow range update spanning multiple days for update operation', () => {
            const result = validateRangeOperation({
                operation: 'update',
                start: futureStart,
                end: addDays(futureEnd, 1),
                rangeId: 'existing-range',
                existingRanges: [],
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBeNull();
        });

        it('should return overlap error when start is not before end for recurring bookings', () => {
            const result = validateRangeOperation({
                operation: 'add',
                start: futureEnd,
                end: futureStart,
                rangeId: 'new-range',
                existingRanges: [],
                recurring: true,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_OVERLAP);
        });

        it('should return overlap error when start equals end for recurring bookings', () => {
            const result = validateRangeOperation({
                operation: 'add',
                start: futureStart,
                end: futureStart,
                rangeId: 'new-range',
                existingRanges: [],
                recurring: true,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_OVERLAP);
        });

        it('should return error when range is in the past', () => {
            const pastStart = set(subDays(new Date(), 7), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
            const pastEnd = set(subDays(new Date(), 7), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });

            const result = validateRangeOperation({
                operation: 'add',
                start: pastStart,
                end: pastEnd,
                rangeId: 'new-range',
                existingRanges: [],
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_IN_PAST);
        });

        it('should return null when range is in the future', () => {
            const result = validateRangeOperation({
                operation: 'add',
                start: futureStart,
                end: futureEnd,
                rangeId: 'new-range',
                existingRanges: [],
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBeNull();
        });

        it('should return error when range id already exists', () => {
            const existingRanges = [createBookingRange({ id: 'existing-range', start: futureStart, end: futureEnd })];
            const newStart = addDays(futureStart, 1);
            const newEnd = addDays(futureEnd, 1);

            const result = validateRangeOperation({
                operation: 'add',
                start: newStart,
                end: newEnd,
                rangeId: 'existing-range',
                existingRanges,
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_ALREADY_EXIST);
        });

        it('should return error when ranges overlap', () => {
            const existingRanges = [createBookingRange({ id: 'existing-range', start: futureStart, end: futureEnd })];
            const overlappingStart = addHours(futureStart, 2);
            const overlappingEnd = addHours(futureEnd, 2);

            const result = validateRangeOperation({
                operation: 'add',
                start: overlappingStart,
                end: overlappingEnd,
                rangeId: 'new-range',
                existingRanges,
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_OVERLAP);
        });

        it('should return null when ranges do not overlap', () => {
            const existingRanges = [createBookingRange({ id: 'existing-range', start: futureStart, end: futureEnd })];
            const newStart = addDays(futureStart, 1);
            const newEnd = addDays(futureEnd, 1);

            const result = validateRangeOperation({
                operation: 'add',
                start: newStart,
                end: newEnd,
                rangeId: 'new-range',
                existingRanges,
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBeNull();
        });

        it('should skip excluded range when checking for overlaps', () => {
            const existingRanges = [createBookingRange({ id: 'existing-range', start: futureStart, end: futureEnd })];

            const result = validateRangeOperation({
                operation: 'update',
                start: futureStart,
                end: futureEnd,
                rangeId: 'new-range',
                existingRanges,
                excludeRangeId: 'existing-range',
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBeNull();
        });

        it('should still check other ranges when one is excluded', () => {
            const existingRanges = [
                createBookingRange({ id: 'range-1', start: futureStart, end: futureEnd }),
                createBookingRange({
                    id: 'range-2',
                    start: addDays(futureStart, 1),
                    end: addDays(futureEnd, 1),
                }),
            ];
            const overlappingStart = addDays(futureStart, 1);
            const overlappingEnd = addDays(futureEnd, 1);

            const result = validateRangeOperation({
                operation: 'update',
                start: overlappingStart,
                end: overlappingEnd,
                rangeId: 'new-range',
                existingRanges,
                excludeRangeId: 'range-1',
                recurring: false,
                timezone: 'Europe/Zurich',
            });

            expect(result).toBe(BookingErrorMessages.RANGE_OVERLAP);
        });
    });

    describe('wasBookingFormTouched', () => {
        it('should return false when initialFormData is undefined', () => {
            const result = wasBookingFormTouched({
                currentFormData: createFormData(),
                initialFormData: undefined,
            });

            expect(result).toBe(false);
        });

        describe('Field change, should return true', () => {
            it.each([
                // Field changes - should return true
                {
                    description: 'summary changed',
                    current: { summary: 'New Summary' },
                    initial: { summary: 'Original Summary' },
                    expected: true,
                },
                {
                    description: 'description changed',
                    current: { description: 'New Description' },
                    initial: { description: 'Original Description' },
                    expected: true,
                },
                {
                    description: 'duration changed',
                    current: { duration: 60 },
                    initial: { duration: 30 },
                    expected: true,
                },
                {
                    description: 'selectedCalendar changed',
                    current: { selectedCalendar: 'calendar-2' },
                    initial: { selectedCalendar: 'calendar-1' },
                    expected: true,
                },
                {
                    description: 'location changed',
                    current: { location: 'New Location' },
                    initial: { location: 'Original Location' },
                    expected: true,
                },
                {
                    description: 'locationType changed',
                    current: { locationType: BookingLocation.OTHER_LOCATION },
                    initial: { locationType: BookingLocation.MEET },
                    expected: true,
                },
                {
                    description: 'recurring changed',
                    current: { recurring: true },
                    initial: { recurring: false },
                    expected: true,
                },
                // Field unchanged - should return false
                {
                    description: 'summary is the same',
                    current: { summary: 'Same Summary' },
                    initial: { summary: 'Same Summary' },
                    expected: false,
                },
                {
                    description: 'description is the same',
                    current: { description: 'Same Description' },
                    initial: { description: 'Same Description' },
                    expected: false,
                },
                {
                    description: 'duration is the same',
                    current: { duration: 30 },
                    initial: { duration: 30 },
                    expected: false,
                },
                {
                    description: 'selectedCalendar is the same',
                    current: { selectedCalendar: 'calendar-1' },
                    initial: { selectedCalendar: 'calendar-1' },
                    expected: false,
                },
                {
                    description: 'location is the same',
                    current: { location: 'Same Location' },
                    initial: { location: 'Same Location' },
                    expected: false,
                },
                {
                    description: 'locationType is the same',
                    current: { locationType: BookingLocation.MEET },
                    initial: { locationType: BookingLocation.MEET },
                    expected: false,
                },
                {
                    description: 'recurring is the same',
                    current: { recurring: false },
                    initial: { recurring: false },
                    expected: false,
                },
            ])('should return $expected when $description', ({ current, initial, expected }) => {
                const result = wasBookingFormTouched({
                    currentFormData: createFormData(current),
                    initialFormData: createFormData(initial),
                });

                expect(result).toBe(expected);
            });
        });

        it('should return false when all fields are identical', () => {
            const formData = createFormData({
                summary: 'Test',
                description: 'Description',
                duration: 30,
                selectedCalendar: 'cal-1',
                location: 'Location',
                locationType: BookingLocation.MEET,
                recurring: false,
                bookingRanges: [createBookingRange({ id: 'range-1' })],
            });

            const result = wasBookingFormTouched({
                currentFormData: { ...formData },
                initialFormData: { ...formData },
            });

            expect(result).toBe(false);
        });
    });
});
