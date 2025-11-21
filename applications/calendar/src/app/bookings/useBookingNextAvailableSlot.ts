import { useMemo } from 'react';

import { addDays, isAfter } from 'date-fns';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

import { useBookingStore } from './booking.store';
import { getGridCount } from './components/bookingViewHelpers';
import { useExternalBookingLoader } from './useExternalBookingLoader';

export enum AvailabilityState {
    HasNextSlot = 'has-next',
    ShouldNavigateToFirst = 'should-navigate-to-first',
    NoSlotAvailable = 'no-slots-available',
}

export const useBookingNextAvailableSlot = () => {
    const { activeBreakpoint } = useActiveBreakpoint();
    const gridSize = getGridCount(activeBreakpoint);
    const bookingSlots = useBookingStore((state) => state.bookingSlots);
    const nextAvailableSlot = useBookingStore((state) => state.nextAvailableSlot);
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const { loadPublicBooking } = useExternalBookingLoader();

    const availabilityState: AvailabilityState = useMemo(() => {
        if (nextAvailableSlot && isAfter(nextAvailableSlot.tzDate, selectedDate)) {
            return AvailabilityState.HasNextSlot;
        }
        if (bookingSlots.length > 0) {
            return AvailabilityState.ShouldNavigateToFirst;
        }
        return AvailabilityState.NoSlotAvailable;
    }, [nextAvailableSlot, selectedDate, bookingSlots]);

    const handleNavigateToNextAvailableSlot = async () => {
        // Redirect to the next event. If no events in the future, redirect to the first available slot
        if (availabilityState === AvailabilityState.HasNextSlot && nextAvailableSlot) {
            const newRangeEnd = addDays(nextAvailableSlot.tzDate, gridSize);
            await loadPublicBooking(nextAvailableSlot.tzDate, newRangeEnd);

            setSelectedDate(nextAvailableSlot.tzDate);
        } else if (availabilityState === AvailabilityState.ShouldNavigateToFirst) {
            const newRangeEnd = addDays(bookingSlots[0].tzDate, gridSize);
            await loadPublicBooking(bookingSlots[0].tzDate, newRangeEnd);

            setSelectedDate(bookingSlots[0].tzDate);
        }
    };

    return {
        availabilityState,
        handleNavigateToNextAvailableSlot,
    };
};
