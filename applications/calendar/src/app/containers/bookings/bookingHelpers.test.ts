import { addHours } from 'date-fns';

import { JSONFormatData, JSONFormatTextData, generateSlotsFromRange } from './bookingHelpers';

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
});
