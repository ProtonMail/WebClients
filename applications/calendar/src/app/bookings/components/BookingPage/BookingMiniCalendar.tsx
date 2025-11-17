import { useEffect, useState } from 'react';

import { startOfMonth, startOfToday } from 'date-fns';

import { Loader, LocalizedMiniCalendar } from '@proton/components';
import { getDaysInMonth } from '@proton/components/components/miniCalendar/helper';
import { getWeekStartsOn } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../../booking.store';
import { WEEKS_IN_MINI_CALENDAR } from '../../constants';
import { useExternalBookingLoader } from '../../useExternalBookingLoader';
import { getDateKey } from '../../utils/bookingsHelpers';

import './BookingMiniCalendar.scss';

interface BookingMiniCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export const BookingMiniCalendar = ({ selectedDate, onSelectDate }: BookingMiniCalendarProps) => {
    const isLoading = useBookingStore((state) => state.isLoading);
    const getDateKeySet = useBookingStore((state) => state.getDateKeySet);
    const [, setDisplayedMonth] = useState(selectedDate);

    const { loadPublicBooking } = useExternalBookingLoader();

    useEffect(() => {
        setDisplayedMonth(startOfMonth(selectedDate));
    }, [selectedDate]);

    const getDayClassName = (date: Date) => {
        const dateKey = getDateKey(date.getTime());
        const hasSlots = getDateKeySet().has(dateKey);
        return hasSlots ? 'booking-day-with-slots' : undefined;
    };

    const handleSelectDate = (date: Date) => {
        onSelectDate(date);
        void loadPublicBooking(date);
    };

    const handleMonthChange = (date: Date) => {
        const startDate = getDaysInMonth(date, {
            weekStartsOn: getWeekStartsOn(dateLocale),
            weeks: WEEKS_IN_MINI_CALENDAR - 1,
        });

        void loadPublicBooking(startDate[0]);
        setDisplayedMonth(startOfMonth(date));
    };

    const today = new Date();

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-center z-up flex items-center justify-center bg-norm opacity-50">
                    <Loader size="medium" />
                </div>
            )}
            <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
                <LocalizedMiniCalendar
                    numberOfWeeks={WEEKS_IN_MINI_CALENDAR}
                    min={startOfToday()}
                    now={today}
                    date={selectedDate}
                    onSelectDate={handleSelectDate}
                    onMonthChange={handleMonthChange}
                    hasCursors
                    getDayClassName={getDayClassName}
                />
            </div>
        </div>
    );
};
