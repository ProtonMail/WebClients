import { addDays, isBefore, startOfDay } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { useBookingStore } from '../../booking.store';

interface Props {
    gridSize: number;
}

export const BookingNavigationButtons = ({ gridSize }: Props) => {
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);

    const isInEarliestRange = isBefore(addDays(startOfDay(selectedDate), -gridSize), startOfDay(new Date()));

    return (
        <div className="flex gap-2">
            <Button
                icon
                pill
                onClick={() => setSelectedDate(addDays(selectedDate, -gridSize))}
                disabled={isInEarliestRange}
            >
                <IcChevronLeft />
            </Button>
            <Button icon pill onClick={() => setSelectedDate(addDays(selectedDate, gridSize))}>
                <IcChevronRight />
            </Button>
        </div>
    );
};
