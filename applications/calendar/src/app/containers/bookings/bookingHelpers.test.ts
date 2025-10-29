import { JSONFormatData, JSONFormatTextData } from './bookingHelpers';

describe('booking helpers', () => {
    describe('JSONFormatData', () => {
        it('should always return the same formatted data', () => {
            const formattedOne = JSONFormatData({
                description: 'description',
                location: 'location',
                summary: 'summary',
            });
            const formattedTwo = JSONFormatData({
                description: 'description',
                summary: 'summary',
                location: 'location',
            });

            const formattedThree = JSONFormatData({
                summary: 'summary',
                description: 'description',
                location: 'location',
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
