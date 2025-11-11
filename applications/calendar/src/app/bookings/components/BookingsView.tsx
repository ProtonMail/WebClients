import { useEffect, useState } from 'react';

import { addDays, format, isToday, startOfDay } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { type BookingTimeslotWithDate, useBookingStore } from '../booking.store';
import { BookSlotModal } from './BookSlotModal';

export const BookingsView = () => {
    const [range, setRange] = useState<Date[]>([]);
    const [timeslot, setTimeslot] = useState<BookingTimeslotWithDate>();
    const getTimeslotsByDate = useBookingStore((state) => state.getTimeslotsByDate);

    const [bookSlotModalProps, setBookSlotModalOpen, renderLinkConfirmationModal] = useModalState();

    useEffect(() => {
        const tmpRange: Date[] = [];
        for (let i = 0; i < 7; i++) {
            tmpRange.push(addDays(startOfDay(new Date()), i));
        }
        setRange(tmpRange);
    }, []);

    return (
        <>
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
        </>
    );
};
