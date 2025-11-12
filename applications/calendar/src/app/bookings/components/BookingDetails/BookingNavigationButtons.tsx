import { addDays, isBefore, startOfDay } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { useBookingStore } from '../../booking.store';

export const BookingNavigationButtons = () => {
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);

    // TODO use range size based on window size
    const isInEarliestRange = isBefore(addDays(startOfDay(selectedDate), -7), startOfDay(new Date()));

    return (
        <div className="flex gap-2">
            <Button
                icon
                pill
                // TODO use range size based on window size
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                disabled={isInEarliestRange}
            >
                <IcChevronLeft />
            </Button>
            <Button
                icon
                pill
                // TODO use range size based on window size
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
                <IcChevronRight />
            </Button>
        </div>
    );
};
