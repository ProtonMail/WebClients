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
import { BookingMiniCalendar } from './BookingMiniCalendar';
import { BookingNavigationButtons } from './BookingNavigationButtons';

interface Props {
    gridSize: number;
}

export const BookingDetailsHeader = ({ gridSize }: Props) => {
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const setSelectedTimezone = useBookingStore((state) => state.setSelectedTimezone);
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <div className="flex justify-space-between w-full mb-4 items-center">
                <h1>{c('Title').t`Choose a time`}</h1>

                <TimeZoneSelector
                    data-testid="calendar-view:time-zone-dropdown"
                    className="w-auto"
                    date={selectedDate}
                    timezone={selectedTimezone || bookingDetails?.timezone || getTimezone()}
                    onChange={setSelectedTimezone}
                    // telemetrySource="temporary_timezone"
                    // abbreviatedTimezone={breakpoint === 'small' ? 'offset' : undefined}
                />
            </div>
            <div className="flex justify-space-between w-full mb-4">
                <div>
                    <Button pill onClick={toggle} ref={anchorRef} className="flex items-center">
                        {/*TODO replace icon*/}
                        <IcCalendarGrid className="mr-2" />
                        {format(selectedDate, 'MMMM Y', { locale: dateLocale })}
                        {isOpen ? <IcChevronUp /> : <IcChevronDown />}
                    </Button>
                    <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                        <BookingMiniCalendar
                            selectedDate={selectedDate}
                            onSelectDate={(date) => setSelectedDate(date)}
                        />
                    </Dropdown>
                </div>

                <BookingNavigationButtons gridSize={gridSize} />
            </div>
        </>
    );
};
