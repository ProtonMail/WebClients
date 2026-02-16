import { addDays, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { useBookingStore } from '../../booking.store';
import { useExternalBookingLoader } from '../../useExternalBookingLoader';

interface Props {
    gridSize: number;
    disabled?: boolean;
}

export const BookingNavigationButtons = ({ gridSize, disabled }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const { loadPublicBooking } = useExternalBookingLoader();

    const isInEarliestRange = isBefore(addDays(startOfDay(selectedDate), -gridSize), startOfDay(new Date()));

    const handleLoadPreviousPage = async () => {
        setSelectedDate(addDays(selectedDate, -gridSize));

        const newRangeStart = addDays(selectedDate, -gridSize);
        const newRangeEnd = addDays(selectedDate, -1);
        await loadPublicBooking(newRangeStart, newRangeEnd);
    };

    const handleLoadNextPage = async () => {
        setSelectedDate(addDays(selectedDate, gridSize));

        const currentRangeEnd = addDays(selectedDate, gridSize);
        const newRangeEnd = addDays(currentRangeEnd, gridSize);
        await loadPublicBooking(currentRangeEnd, newRangeEnd);
    };

    return (
        <div className="flex gap-2">
            <Tooltip title={c('Action').t`See previous availability`}>
                <Button
                    icon
                    pill
                    size={viewportWidth['<=small'] ? 'medium' : 'large'}
                    className="booking-buttons rtl:mirror"
                    onClick={handleLoadPreviousPage}
                    disabled={isInEarliestRange || disabled}
                >
                    <IcChevronLeft size={6} alt={c('Action').t`See previous availability`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`See upcoming availability`}>
                <Button
                    icon
                    pill
                    size={viewportWidth['<=small'] ? 'medium' : 'large'}
                    onClick={handleLoadNextPage}
                    disabled={disabled}
                    className="booking-buttons rtl:mirror"
                >
                    <IcChevronRight size={6} alt={c('Action').t`See upcoming availability`} />
                </Button>
            </Tooltip>
        </div>
    );
};
