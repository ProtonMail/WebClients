import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { TimeZoneSelector } from '@proton/components/components/timezoneSelector/TimeZoneSelector';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
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

const IconHeroCalendar = ({ className }: { className?: string }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.5 0.75V3M15 0.75V3M0.75 16.5V5.25C0.75 4.00736 1.75736 3 3 3H16.5C17.7426 3 18.75 4.00736 18.75 5.25V16.5M0.75 16.5C0.75 17.7426 1.75736 18.75 3 18.75H16.5C17.7426 18.75 18.75 17.7426 18.75 16.5M0.75 16.5V9C0.75 7.75736 1.75736 6.75 3 6.75H16.5C17.7426 6.75 18.75 7.75736 18.75 9V16.5M9.75 10.5H9.7575V10.5075H9.75V10.5ZM9.75 12.75H9.7575V12.7575H9.75V12.75ZM9.75 15H9.7575V15.0075H9.75V15ZM7.5 12.75H7.5075V12.7575H7.5V12.75ZM7.5 15H7.5075V15.0075H7.5V15ZM5.25 12.75H5.2575V12.7575H5.25V12.75ZM5.25 15H5.2575V15.0075H5.25V15ZM12 10.5H12.0075V10.5075H12V10.5ZM12 12.75H12.0075V12.7575H12V12.75ZM12 15H12.0075V15.0075H12V15ZM14.25 10.5H14.2575V10.5075H14.25V10.5ZM14.25 12.75H14.2575V12.7575H14.25V12.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const IconHeroWorldMap = ({ className }: { className?: string }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 17.5C13.4938 17.5 16.4296 15.111 17.2631 11.8775M10 17.5C6.50619 17.5 3.57035 15.111 2.73692 11.8775M10 17.5C12.0711 17.5 13.75 14.1421 13.75 10C13.75 5.85786 12.0711 2.5 10 2.5M10 17.5C7.92893 17.5 6.25 14.1421 6.25 10C6.25 5.85786 7.92893 2.5 10 2.5M10 2.5C12.8043 2.5 15.2492 4.03912 16.5359 6.31871M10 2.5C7.19567 2.5 4.75083 4.03912 3.4641 6.31871M16.5359 6.31871C14.7831 7.83366 12.4986 8.75 10 8.75C7.50143 8.75 5.21689 7.83366 3.4641 6.31871M16.5359 6.31871C17.1497 7.40619 17.5 8.66219 17.5 10C17.5 10.6483 17.4177 11.2774 17.2631 11.8775M17.2631 11.8775C15.1111 13.0706 12.6349 13.75 10 13.75C7.36509 13.75 4.88885 13.0706 2.73692 11.8775M2.73692 11.8775C2.58226 11.2774 2.5 10.6483 2.5 10C2.5 8.66219 2.85027 7.40619 3.4641 6.31871"
                stroke="currentColor"
            />
        </svg>
    );
};

export const BookingHeader = ({ gridSize, availabilityState }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
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
                    className="w-auto mb-2 mt-1"
                    date={selectedDate}
                    timezone={selectedTimezone || bookingDetails?.timezone || getTimezone()}
                    onChange={setSelectedTimezone}
                    unstyledSelect
                    prefixIcon={<IconHeroWorldMap className="mr-2" />}
                    caretIconName="chevron-down"
                    // telemetrySource="temporary_timezone"
                    // abbreviatedTimezone={breakpoint === 'small' ? 'offset' : undefined}
                />
            </div>
            <div className="flex justify-between w-full mb-4">
                <div className="flex-1 flex space-between mr-2">
                    <Button
                        pill
                        onClick={toggle}
                        ref={anchorRef}
                        className="flex flex-nowrap gap-2 items-center booking-buttons booking-button-minicalendar text-semibold justify-center"
                        aria-expanded={isOpen}
                        disabled={hasNoSlots}
                        size={viewportWidth['<=small'] ? 'medium' : 'large'}
                    >
                        <IconHeroCalendar className="booking-button-minicalendar-icon" />
                        <span className="text-ellipsis">{format(selectedDate, 'MMMM Y', { locale: dateLocale })}</span>
                        {isOpen ? <IcChevronUp className="shrink-0" /> : <IcChevronDown className="shrink-0" />}
                    </Button>
                    <Dropdown
                        anchorRef={anchorRef}
                        isOpen={isOpen}
                        onClose={close}
                        autoClose={false}
                        autoCloseOutside
                        className="p-2 rounded-xl booking-mini-calendar"
                        adaptiveForTouchScreens={false}
                    >
                        <BookingMiniCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                    </Dropdown>
                </div>

                <BookingNavigationButtons gridSize={gridSize} disabled={hasNoSlots} />
            </div>
        </>
    );
};
