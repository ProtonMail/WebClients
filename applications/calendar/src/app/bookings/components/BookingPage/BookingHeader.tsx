import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { TimeZoneSelector } from '@proton/components/components/timezoneSelector/TimeZoneSelector';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../../booking.store';
import { AvailabilityState } from '../../useBookingNextAvailableSlot';
import { BookingMiniCalendar } from './BookingMiniCalendar';
import { BookingNavigationButtons } from './BookingNavigationButtons';

import './BookingMiniCalendar.scss';

interface Props {
    gridSize: number;
    availabilityState: AvailabilityState;
}

export const BookingHeader = ({ gridSize, availabilityState }: Props) => {
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const setSelectedTimezone = useBookingStore((state) => state.setSelectedTimezone);
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    const hasNoSlots = availabilityState === AvailabilityState.NoSlotAvailable;

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        close();
    };

    return (
        <>
            <div className="flex flex-row justify-space-between w-full mb-4 items-center">
                <h2
                    className="text-4xl mt-0 mb-2 mr-4 booking-color-title font-arizona"
                    id="booking-main-header-title"
                >{c('Title').t`Choose a time`}</h2>

                <TimeZoneSelector
                    data-testid="calendar-view:time-zone-dropdown"
                    disabled={hasNoSlots}
                    className="w-auto mb-2"
                    date={selectedDate}
                    timezone={selectedTimezone || bookingDetails?.timezone || getTimezone()}
                    onChange={setSelectedTimezone}
                    unstyledSelect
                    // telemetrySource="temporary_timezone"
                    // abbreviatedTimezone={breakpoint === 'small' ? 'offset' : undefined}
                />
            </div>
            <div className="flex justify-between w-full mb-4">
                <div className="flex-1 flex space-between">
                    <Button
                        pill
                        onClick={toggle}
                        ref={anchorRef}
                        className="flex items-center"
                        aria-expanded={isOpen}
                        disabled={hasNoSlots}
                    >
                        {/*TODO replace icon*/}
                        <IcCalendarGrid className="mr-2" />
                        {format(selectedDate, 'MMMM Y', { locale: dateLocale })}
                        {isOpen ? <IcChevronUp /> : <IcChevronDown />}
                    </Button>
                    <Dropdown
                        anchorRef={anchorRef}
                        isOpen={isOpen}
                        onClose={close}
                        autoClose={false}
                        autoCloseOutside
                        className="p-2 rounded-xl booking-mini-calendar"
                    >
                        <BookingMiniCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                    </Dropdown>
                </div>

                <BookingNavigationButtons gridSize={gridSize} disabled={hasNoSlots} />
            </div>
        </>
    );
};
