import { deduplicateBusySlots } from './busySlotsSelectors.helpers';
import { BusySlot } from './busySlotsSlice';

describe('deduplicateBusySlots', () => {
    it('should deduplicate equal busy slots', () => {
        const busySlots = [
            { Start: 1, End: 2 },
            { Start: 1, End: 2 },
            { Start: 1, End: 2 },
            { Start: 2, End: 3 },
        ] as BusySlot[];

        expect(deduplicateBusySlots(busySlots)).toEqual([
            { Start: 1, End: 2 },
            { Start: 2, End: 3 },
        ]);
    });
});
