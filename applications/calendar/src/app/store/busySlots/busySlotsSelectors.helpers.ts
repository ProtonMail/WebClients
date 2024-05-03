import { BusySlot } from './busySlotsSlice';

export const deduplicateBusySlots = (busySlots: BusySlot[]): BusySlot[] =>
    busySlots.reduce<BusySlot[]>((acc, busySlot) => {
        const isDuplicate = acc.some((slot) => slot.Start === busySlot.Start && slot.End === busySlot.End);
        if (isDuplicate) {
            return acc;
        }

        acc.push(busySlot);
        return acc;
    }, []);
