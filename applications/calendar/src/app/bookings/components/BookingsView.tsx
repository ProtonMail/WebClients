import { useEffect, useState } from 'react';

import { format, isToday } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { type BookingTimeslotWithDate, useBookingStore } from '../booking.store';
import { BookSlotModal } from './BookSlotModal';
import { BookingDetailsHeader } from './BookingDetails/BookingDetailsHeader';
import { getDaysRange, getDaysSlotRange, getFirstAvailableSlotDate, getGridCount } from './bookingViewHelpers';

export const BookingsView = () => {
    const [range, setRange] = useState<Date[]>([]);
    const [timeslot, setTimeslot] = useState<BookingTimeslotWithDate>();
    const [slotsArray, setSlotsArray] = useState<BookingTimeslotWithDate[][] | undefined[][]>([]);

    const getTimeslotsByDate = useBookingStore((state) => state.getTimeslotsByDate);
    const getAllDaySlots = useBookingStore((state) => state.getAllDaySlots);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedDate = useBookingStore((state) => state.selectedDate);

    const { activeBreakpoint } = useActiveBreakpoint();
    const gridSize = getGridCount(activeBreakpoint);
    const canShowSlots = slotsArray.length > 0;

    const [bookSlotModalProps, setBookSlotModalOpen, renderBookModal] = useModalState();

    const handleGoToNextAvailableAppointment = () => {
        const allDaySlots = getAllDaySlots();
        const firstAvailableDate = getFirstAvailableSlotDate(allDaySlots);

        if (firstAvailableDate) {
            setSelectedDate(firstAvailableDate);
        }
    };

    useEffect(() => {
        if (!bookingDetails) {
            return;
        }

        const tmpRange = getDaysRange(gridSize, selectedDate);
        const rangeBooking = getDaysSlotRange(gridSize, bookingDetails, getTimeslotsByDate, selectedDate);

        setRange(tmpRange);
        setSlotsArray(rangeBooking);
    }, [gridSize, getTimeslotsByDate, bookingDetails, selectedDate]);

    return (
        <div>
            <BookingDetailsHeader gridSize={gridSize} />

            <div className="flex gap-2">
                {range.map((date, i) => (
                    <div key={date.getTime()}>
                        <div className="flex flex-column items-center">
                            <p className="m-0">{format(date, 'EEE', { locale: dateLocale })}</p>
                            <p
                                className={clsx(
                                    'm-0 h-8 w-8 text-lg text-semibold',
                                    isToday(date) && 'rounded-full bg-primary'
                                )}
                            >
                                {format(date, 'd', { locale: dateLocale })}
                            </p>
                        </div>
                        <div className="flex flex-column gap-2">
                            {canShowSlots &&
                                slotsArray[i].map((timeslot, j) => {
                                    return timeslot ? (
                                        <Button
                                            key={timeslot.id}
                                            shape="outline"
                                            color="norm"
                                            className="w-full"
                                            onClick={() => {
                                                setTimeslot(timeslot);
                                                setBookSlotModalOpen(true);
                                            }}
                                        >
                                            {format(timeslot.date, 'HH:mm', { locale: dateLocale })}
                                        </Button>
                                    ) : (
                                        <Button
                                            key={`${i}-${j}`}
                                            disabled
                                            shape="outline"
                                            color="norm"
                                            className="w-full"
                                        >
                                            -
                                        </Button>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>
            {!canShowSlots && (
                <div className="border rounded flex flex-column items-center justify-center p-8 mt-2 text-center">
                    <div>{c('Info').t`No appointments available this week`}</div>
                    <Button shape="underline" color="norm" onClick={handleGoToNextAvailableAppointment}>{c('Action')
                        .t`Go to the next available appointment`}</Button>
                </div>
            )}
            {renderBookModal && timeslot && <BookSlotModal timeslot={timeslot} {...bookSlotModalProps} />}
        </div>
    );
};
