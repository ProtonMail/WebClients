import { addHours } from 'date-fns';

import { generateSlotsFromRange } from './slotHelpers';

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
});
