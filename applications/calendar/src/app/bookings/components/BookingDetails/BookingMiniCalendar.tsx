import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { format, startOfMonth, startOfToday } from 'date-fns';

import { Loader, LocalizedMiniCalendar } from '@proton/components';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../../booking.store';
import { useExternalBookingLoader } from '../../useExternalBookingLoader';

import './BookingMiniCalendar.scss';

interface BookingMiniCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export const BookingMiniCalendar = ({ selectedDate, onSelectDate }: BookingMiniCalendarProps) => {
    const location = useLocation();
    const bookingSecretBase64Url = location.hash.substring(1);
    const { loadPublicBooking } = useExternalBookingLoader();
    const isLoading = useBookingStore((state) => state.isLoading);
    const getDaysWithSlots = useBookingStore((state) => state.getDaysWithSlots);
    const getAllDaySlots = useBookingStore((state) => state.getAllDaySlots);
    const [displayedMonth, setDisplayedMonth] = useState(selectedDate);
    const loadedMonthsRef = useRef<Set<string>>(new Set());
    const [hasInitialized, setHasInitialized] = useState(false);

    const daysWithSlots = getDaysWithSlots();

    const handleDisplayedDaysChange = useCallback(
        (days: Date[]) => {
            const monthKey = format(displayedMonth, 'yyyy-MM', { locale: dateLocale });

            if (!loadedMonthsRef.current.has(monthKey) && days.length > 0) {
                loadedMonthsRef.current.add(monthKey);

                void loadPublicBooking(bookingSecretBase64Url, days);
            }
        },
        [bookingSecretBase64Url, loadPublicBooking, displayedMonth]
    );

    useEffect(() => {
        setDisplayedMonth(startOfMonth(selectedDate));
    }, [selectedDate]);

    useEffect(() => {
        if (!hasInitialized && !isLoading) {
            const allDaySlots = getAllDaySlots();
            const earliestAvailableDate = allDaySlots[0]?.date;
            if (earliestAvailableDate) {
                setHasInitialized(true);
                onSelectDate(earliestAvailableDate);
            }
        }
    }, [hasInitialized, isLoading, getAllDaySlots, onSelectDate]);

    const getDayClassName = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd', { locale: dateLocale });
        const hasSlots = daysWithSlots.has(dateKey);
        return hasSlots ? 'booking-day-with-slots' : '';
    };

    const handleSelectDate = (date: Date) => {
        onSelectDate(date);
    };

    const handleMonthChange = (date: Date) => {
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
                    min={startOfToday()}
                    now={today}
                    date={selectedDate}
                    onSelectDate={handleSelectDate}
                    onMonthChange={handleMonthChange}
                    onDisplayedDaysChange={handleDisplayedDaysChange}
                    hasCursors
                    getDayClassName={getDayClassName}
                />
            </div>
        </div>
    );
};

export default BookingMiniCalendar;
