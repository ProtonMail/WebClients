import { addDays, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
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
            <Tooltip title={c('Action').t`See previous availability`}>
                <Button
                    icon
                    pill
                    onClick={() => setSelectedDate(addDays(selectedDate, -gridSize))}
                    disabled={isInEarliestRange}
                >
                    <IcChevronLeft alt={c('Action').t`See previous availability`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`See upcoming availability`}>
                <Button icon pill onClick={() => setSelectedDate(addDays(selectedDate, gridSize))}>
                    <IcChevronRight alt={c('Action').t`See upcoming availability`} />
                </Button>
            </Tooltip>
        </div>
    );
};
