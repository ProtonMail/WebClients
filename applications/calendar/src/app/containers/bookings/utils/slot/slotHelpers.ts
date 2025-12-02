import { addMinutes, isBefore } from 'date-fns';

import type { Slot } from '../../interface';
import { BOOKING_SLOT_ID } from '../../interface';

export const generateSlotsFromRange = ({
    rangeID,
    start,
    end,
    duration,
    timezone,
}: {
    rangeID: string;
    start: Date;
    end: Date;
    duration: number;
    timezone: string;
}): Slot[] => {
    let currentStart = start;

    const slots: Slot[] = [];
    while (isBefore(currentStart, end)) {
        const currentEnd = addMinutes(currentStart, duration);
        const slotID = `${BOOKING_SLOT_ID}-${currentStart.getTime().toString()}-${currentEnd.getTime().toString()}`;

        // Only add the slot if it fits completely within the range
        if (currentEnd.getTime() <= end.getTime()) {
            slots.push({
                rangeID,
                id: slotID,
                start: currentStart,
                end: currentEnd,
                timezone,
            });
        }

        currentStart = currentEnd;
    }

    return slots;
};
