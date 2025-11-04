import { set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import TimeInput from '@proton/components/components/input/TimeInput';
import { DateInputTwo } from '@proton/components/index';
import { IcPlus, IcTrash } from '@proton/icons';

import { useBookings } from '../bookingsProvider/BookingsProvider';
import type { BookingRange } from '../bookingsProvider/interface';

export const FormRangeList = () => {
    const { bookingRange, removeBookingRange, updateBookingRange } = useBookings();

    if (!bookingRange) {
        // TODO have a placeholder if no booking range is available
        return null;
    }

    const handleTimeChange = (id: string, start?: Date, end?: Date) => {
        if (!start || !end) {
            return;
        }

        updateBookingRange(id, start, end);
    };

    const handleDateChange = (id: string, range: BookingRange, date?: Date) => {
        if (!date) {
            return;
        }

        const newStart = set(date, { hours: range.start.getHours(), minutes: range.start.getMinutes() });
        const newEnd = set(date, { hours: range.end.getHours(), minutes: range.end.getMinutes() });

        updateBookingRange(id, newStart, newEnd);
    };

    // TODO handle the cases where the recurring is enabled and adapt the UI
    return (
        <div>
            {bookingRange.map((range) => (
                <div key={range.id} className="flex flex-nowrap gap-6 justify-space-between mb-0.5">
                    <div className="flex items-center gap-0.5">
                        <label htmlFor={`range-date-input-${range.id}`} className="sr-only">{c('label')
                            .t`Date of the booking range`}</label>
                        <DateInputTwo
                            id={`range-date-input-${range.id}`}
                            value={range.start}
                            onChange={(value) => handleDateChange(range.id, range, value)}
                        />
                        <label htmlFor={`range-start-input-${range.id}`} className="sr-only">{c('label')
                            .t`Start time of the booking range`}</label>
                        <TimeInput
                            id={`range-start-time-${range.id}`}
                            value={range.start}
                            onChange={(value) => handleTimeChange(range.id, value, range.end)}
                        />
                        -
                        <label htmlFor={`range-end-time-${range.id}`} className="sr-only">{c('label')
                            .t`End time of the booking range`}</label>
                        <TimeInput
                            id={`range-end-time-${range.id}`}
                            value={range.end}
                            onChange={(value) => handleTimeChange(range.id, range.start, value)}
                        />
                    </div>
                    <div className="flex flex-nowrap shrink-0">
                        <Button icon shape="ghost">
                            <IcPlus
                                name="plus"
                                className="color-primary"
                                alt={c('Action').t`Split current booking range`}
                            />
                        </Button>
                        <Button icon shape="ghost" onClick={() => removeBookingRange(range.id)}>
                            <IcTrash className="color-weak" alt={c('Action').t`Remove the booking range`} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
