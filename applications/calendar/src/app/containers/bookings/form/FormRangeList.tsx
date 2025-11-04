import { set } from 'date-fns';

import { Button } from '@proton/atoms/Button/Button';
import TimeInput from '@proton/components/components/input/TimeInput';
import { DateInputTwo, Icon } from '@proton/components/index';

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
                        <DateInputTwo
                            id="range-date-input"
                            value={range.start}
                            onChange={(value) => handleDateChange(range.id, range, value)}
                        />
                        <TimeInput
                            id="range-start-time"
                            value={range.start}
                            onChange={(value) => handleTimeChange(range.id, value, range.end)}
                        />
                        -
                        <TimeInput
                            id="range-end-time"
                            value={range.end}
                            onChange={(value) => handleTimeChange(range.id, range.start, value)}
                        />
                    </div>
                    <div className="flex flex-nowrap shrink-0">
                        <Button icon shape="ghost">
                            <Icon name="plus" className="color-primary" />
                        </Button>
                        <Button icon shape="ghost" onClick={() => removeBookingRange(range.id)}>
                            <Icon name="trash" className="color-weak" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
