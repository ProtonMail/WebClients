import { useEffect, useState } from 'react';

import { addDays, format, isToday, startOfDay } from 'date-fns';

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
    const getTimeslotsByDate = useBookingStore((state) => state.getTimeslotsByDate);

    const { activeBreakpoint } = useActiveBreakpoint();
    const gridSize = getGridCount(activeBreakpoint);

    const [bookSlotModalProps, setBookSlotModalOpen, renderLinkConfirmationModal] = useModalState();

    useEffect(() => {
        const tmpRange: Date[] = [];
        for (let i = 0; i < gridSize; i++) {
            tmpRange.push(addDays(startOfDay(selectedDate), i));
        }

        setRange(tmpRange);
    }, [gridSize, selectedDate]);

    return (
        <div>
            <BookingDetailsHeader />

            <div className="flex gap-2">
                {range.map((date) => {
                    return (
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
                                {getTimeslotsByDate(date).map((timeslot) => {
                                    return (
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
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {renderLinkConfirmationModal && timeslot && <BookSlotModal timeslot={timeslot} {...bookSlotModalProps} />}
        </div>
    );
};
