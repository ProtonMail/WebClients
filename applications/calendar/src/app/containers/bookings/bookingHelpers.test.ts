import { addHours } from 'date-fns';

import { JSONFormatData, JSONFormatTextData, generateSlotsFromRange, validateFormData } from './bookingHelpers';
import { type BookingFormData, BookingLocation } from './bookingsProvider/interface';

describe('booking helpers', () => {
    describe('generateSlotsFromRange', () => {
        const startDate = new Date(2025, 0, 1, 10, 0, 0);

        it('should create one event when one hour available', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 1),
                duration: 60,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(1);
        });

        it('should create two events when two hours available', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 2),
                duration: 60,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(2);
        });

        it('should create one event when two hours available for 1.5 hours slot', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 2),
                duration: 90,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(1);
        });

        it('should return 0 events when one hour available for 1.5 hours slot', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 1),
                duration: 90,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(0);
        });
    });

    describe('JSONFormatData', () => {
        it('should always return the same formatted data', () => {
            const formattedOne = JSONFormatData({
                description: 'description',
                location: 'location',
                summary: 'summary',
                withProtonMeetLink: true,
            });
            const formattedTwo = JSONFormatData({
                description: 'description',
                summary: 'summary',
                location: 'location',
                withProtonMeetLink: true,
            });

            const formattedThree = JSONFormatData({
                summary: 'summary',
                description: 'description',
                location: 'location',
                withProtonMeetLink: true,
            });

            expect(formattedOne).toEqual(formattedTwo);
            expect(formattedOne).toEqual(formattedThree);
        });
    });

    describe('JSONFormatTextData', () => {
        it('should always return the same formatted data', () => {
            const formattedOne = JSONFormatTextData({
                EndTime: 10000,
                RRule: 'rrule',
                StartTime: 5000,
                Timezone: 'timezone',
            });
            const formattedTwo = JSONFormatTextData({
                EndTime: 10000,
                RRule: 'rrule',
                Timezone: 'timezone',
                StartTime: 5000,
            });

            const formattedThree = JSONFormatTextData({
                EndTime: 10000,
                Timezone: 'timezone',
                RRule: 'rrule',
                StartTime: 5000,
            });

            const formattedFour = JSONFormatTextData({
                Timezone: 'timezone',
                EndTime: 10000,
                RRule: 'rrule',
                StartTime: 5000,
            });

            expect(formattedOne).toEqual(formattedTwo);
            expect(formattedOne).toEqual(formattedThree);
            expect(formattedOne).toEqual(formattedFour);
        });
    });

    describe('validateFormData', () => {
        const validForm: BookingFormData = {
            title: 'Page title',
            selectedCalendar: null,
            locationType: BookingLocation.MEET,
            duration: 60,
            timezone: 'Europe/Zurich',
            bookingSlots: [
                {
                    id: '10',
                    rangeID: 'rangeID',
                    start: new Date(),
                    end: new Date(),
                    timezone: 'Europe/Zurich',
                },
            ],
        };

        it('should return true if the form is valid', () => {
            const result = validateFormData(validForm);

            expect(result).toEqual(undefined);
        });

        it('should return warning if no title', () => {
            const result = validateFormData({ ...validForm, title: '' });

            expect(result).toEqual({
                type: 'warning',
            });
        });

        it('should return warning if title only has spaces title', () => {
            const result = validateFormData({ ...validForm, title: '  ' });

            expect(result).toEqual({
                type: 'warning',
            });
        });

        it('should return error if no booking slot', () => {
            const result = validateFormData({ ...validForm, bookingSlots: [] });

            expect(result).toEqual({
                type: 'warning',
            });
        });
    });
});
