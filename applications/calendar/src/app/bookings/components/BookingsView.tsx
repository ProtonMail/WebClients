import { useEffect, useState } from 'react';

import { addDays, format, isToday } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { ActiveBreakpoint } from '@proton/components/hooks/useActiveBreakpoint';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { type BookingTimeslotWithDate, useBookingStore } from '../booking.store';
import { BookSlotModal } from './BookSlotModal';
import { BookingDetailsHeader } from './BookingDetails/BookingDetailsHeader';

const getGridCount = (activeBreakpoint: ActiveBreakpoint) => {
    switch (activeBreakpoint) {
        case 'xsmall':
        case 'small':
            return 3;
        case 'medium':
            return 5;
        case 'large':
        case 'xlarge':
        case '2xlarge':
            return 7;
    }
};

export const BookingsView = () => {
    const [range, setRange] = useState<Date[]>([]);
    const [timeslot, setTimeslot] = useState<BookingTimeslotWithDate>();
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const [slotsArray, setSlotsArray] = useState<BookingTimeslotWithDate[][] | undefined[][]>([]);

    const getTimeslotsByDate = useBookingStore((state) => state.getTimeslotsByDate);

    const { activeBreakpoint } = useActiveBreakpoint();
    const gridSize = getGridCount(activeBreakpoint);

    const [bookSlotModalProps, setBookSlotModalOpen, renderLinkConfirmationModal] = useModalState();

    useEffect(() => {
        const tmpRange: Date[] = [];
        const slotRange: BookingTimeslotWithDate[][] = [];

        let mostTimeSlotsInGrid = 0;

        // We initalize the array to contains the dates and the booking slots
        for (let i = 0; i < gridSize; i++) {
            const date = addDays(selectedDate, i);

            tmpRange.push(date);

            const timeslots = getTimeslotsByDate(date);
            mostTimeSlotsInGrid = Math.max(mostTimeSlotsInGrid, timeslots.length);
            slotRange.push(timeslots);
        }

        // We get the day with the most bookings that will be used to render the grid
        // We create an array of arrays with the same length as the days with the most bookings
        const rangeBooking: string[][] = new Array(gridSize).fill(new Array(mostTimeSlotsInGrid).fill(''));

        const finalArray = rangeBooking.map((row, rowIndex) => {
            // We return early if we have no slots for the day
            if (slotRange[rowIndex].length === 0) {
                return new Array(mostTimeSlotsInGrid).fill(undefined);
            }
            const rowState = row.map((_c, cellIndex) => {
                const timeslot = slotRange[rowIndex][cellIndex];
                if (timeslot) {
                    return timeslot;
                } else {
                    return undefined;
                }
            });

            return rowState;
        });

        setRange(tmpRange);
        setSlotsArray(finalArray);
    }, [gridSize, getTimeslotsByDate, selectedDate]);

    return (
        <div>
            <BookingDetailsHeader />

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
                            {slotsArray[i].map((timeslot, j) => {
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
                                    <Button key={`${i}-${j}`} disabled shape="outline" color="norm" className="w-full">
                                        -
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {renderLinkConfirmationModal && timeslot && <BookSlotModal timeslot={timeslot} {...bookSlotModalProps} />}
        </div>
    );
};
