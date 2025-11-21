import { addDays, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { useBookingStore } from '../../booking.store';
import { useExternalBookingLoader } from '../../useExternalBookingLoader';

interface Props {
    gridSize: number;
    disabled?: boolean;
}

export const BookingNavigationButtons = ({ gridSize, disabled }: Props) => {
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const { loadPublicBooking } = useExternalBookingLoader();

    const isInEarliestRange = isBefore(addDays(startOfDay(selectedDate), -gridSize), startOfDay(new Date()));

    // TODO improve with loaded slots caching
    const handleLoadPreviousPage = async () => {
        const newRangeStart = addDays(selectedDate, -gridSize);
        await loadPublicBooking(newRangeStart, selectedDate);
        setSelectedDate(addDays(selectedDate, -gridSize));
    };

    // TODO improve with loaded slots caching
    const handleLoadNextPage = async () => {
        const currentRangeEnd = addDays(selectedDate, gridSize);
        const newRangeEnd = addDays(currentRangeEnd, gridSize);
        await loadPublicBooking(currentRangeEnd, newRangeEnd);
        setSelectedDate(addDays(selectedDate, gridSize));
    };

    return (
        <div className="flex gap-2">
            <Tooltip title={c('Action').t`See previous availability`}>
                <Button icon pill onClick={handleLoadPreviousPage} disabled={isInEarliestRange || disabled}>
                    <IcChevronLeft alt={c('Action').t`See previous availability`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`See upcoming availability`}>
                <Button icon pill onClick={handleLoadNextPage} disabled={disabled}>
                    <IcChevronRight alt={c('Action').t`See upcoming availability`} />
                </Button>
            </Tooltip>
        </div>
    );
};
