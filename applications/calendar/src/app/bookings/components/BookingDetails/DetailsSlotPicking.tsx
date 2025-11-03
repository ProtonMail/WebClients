import { useCallback } from 'react';

import format from 'date-fns/format';
import { c } from 'ttag';

import { Button } from '@proton/atoms';

import type { BookingTimeslot } from '../../booking.store';
import { useBookingStore } from '../../booking.store';
import { useExternalBookingActions } from '../../useExternalBookingActions';
import { useBookingSlotModal } from '../BookingSlotModal';
import BookingMiniCalendar from './BookingMiniCalendar';

export const DetailsSlotPicking = () => {
    const { bookingDetails, submitBooking } = useExternalBookingActions();
    const selectedDate = useBookingStore((state) => state.selectedDate);
    const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
    const getTimeslotsByDate = useBookingStore((state) => state.getTimeslotsByDate);
    const [bookingSlotModal, showBookingSlotModal] = useBookingSlotModal();

    const selectedDayTimeslots = getTimeslotsByDate(selectedDate);

    const handleSelectDate = useCallback(
        (date: Date) => {
            setSelectedDate(date);
        },
        [setSelectedDate]
    );

    const handleSlotClick = useCallback(
        (timeslot: BookingTimeslot) => {
            if (!bookingDetails) {
                return;
            }
            showBookingSlotModal({
                bookingDetails,
                timeslot,
                onConfirm: async (name, email) => {
                    await submitBooking(timeslot, { name, email });
                },
            });
        },
        [bookingDetails, showBookingSlotModal, submitBooking]
    );

    if (!bookingDetails) {
        return;
    }

    return (
        <div className="mt-6 border rounded-xl p-10">
            <div className="flex gap-8">
                <div className="flex-1">
                    <BookingMiniCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                </div>
                <div className="flex-1">
                    <h3 className="text-bold mb-4">{format(selectedDate, 'EEEE d')}</h3>
                    {selectedDayTimeslots.length === 0 ? (
                        <p className="color-weak">{c('Info').t`No available slots for this day`}</p>
                    ) : (
                        <div className="flex flex-column gap-2">
                            {selectedDayTimeslots.map((timeslot) => {
                                return (
                                    <Button
                                        key={timeslot.id}
                                        shape="outline"
                                        color="norm"
                                        className="w-full"
                                        onClick={() => {
                                            handleSlotClick(timeslot);
                                        }}
                                    >
                                        {format(timeslot.date, 'HH:mm')}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            {bookingSlotModal}
        </div>
    );
};
