import format from 'date-fns/format';
import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms';

import { useBookingStore } from '../../booking.store';

export const DetailsSlotPicking = () => {
    const daySlots = useBookingStore(useShallow((state) => state.getAllDaySlots()));

    return (
        <div className="mt-6 border rounded-xl p-10">
            {daySlots.map((daySlot) => {
                return (
                    <div key={daySlot.date.toDateString()}>
                        <span>{daySlot.date.toDateString()}</span>
                        {daySlot.timeslots.map((timeslot) => {
                            const dateTime = new Date(timeslot.startTime * 1000);
                            return (
                                <div key={timeslot.id}>
                                    <span>{format(dateTime, 'hh:mm')}</span>
                                    <Button>{c('Action').t`Book`}</Button>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
