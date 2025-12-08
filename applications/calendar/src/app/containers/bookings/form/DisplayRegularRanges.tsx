import { Fragment } from 'react';

import { isSameDay, startOfToday } from 'date-fns';
import { c } from 'ttag';

import DateInputTwo from '@proton/components/components/v2/input/DateInputTwo';

import type { BookingFormData, BookingRange } from '../interface';
import { wouldOverflowDay } from '../utils/form/formHelpers';
import {
    AddButton,
    EndTimeInput,
    RangeEndTimeLabel,
    RangeErrors,
    RangeStartTimeLabel,
    RangeWrapper,
    RemoveButton,
    StartTimeInput,
} from './FormRangeListShared';

import './DisplayRegularRanges.scss';

interface Props {
    formData: BookingFormData;
    removeBookingRange: (id: string) => void;
    onStartChange: (range: BookingRange, value: Date) => void;
    onEndChange: (range: BookingRange, value: Date) => void;
    onDateChange: (id: string, range: BookingRange, value?: Date) => void;
    onPlusClick: (range: BookingRange) => void;
}

export const DisplayRegularRanges = ({
    formData,
    removeBookingRange,
    onStartChange,
    onEndChange,
    onDateChange,
    onPlusClick,
}: Props) => {
    const isPlusDisabled = (range: BookingRange) => {
        return formData.bookingRanges.filter((r) => isSameDay(r.start, range.start)).some(wouldOverflowDay);
    };

    return formData.bookingRanges.map((range) => (
        <Fragment key={range.id}>
            <RangeWrapper>
                <div className="flex flex-1 items-center gap-0.5">
                    <label htmlFor={`range-date-input-${range.id}`} className="sr-only">{c('label')
                        .t`Date of the booking range`}</label>
                    <div className="grow-custom flex-1 flex" style={{ '--grow-custom': '1.5' }}>
                        <DateInputTwo
                            id={`range-date-input-${range.id}`}
                            value={range.start}
                            min={startOfToday()}
                            onChange={(value) => onDateChange(range.id, range, value)}
                            className="booking-date-input"
                        />
                    </div>
                    <RangeStartTimeLabel htmlFor={`range-start-time-${range.id}`} />
                    <StartTimeInput
                        id={`range-start-time-${range.id}`}
                        range={range}
                        duration={formData.duration}
                        onChange={(value) => onStartChange(range, value)}
                        className="booking-time-input"
                    />
                    -
                    <RangeEndTimeLabel htmlFor={`range-end-time-${range.id}`} />
                    <EndTimeInput
                        id={`range-end-time-${range.id}`}
                        range={range}
                        duration={formData.duration}
                        onChange={(value) => onEndChange(range, value)}
                        className="booking-time-input"
                    />
                </div>
                <div className="flex flex-nowrap shrink-0">
                    <AddButton onClick={() => onPlusClick(range)} disabled={isPlusDisabled(range)} />
                    <RemoveButton onClick={() => removeBookingRange(range.id)} />
                </div>
            </RangeWrapper>
            <RangeErrors range={range} />
        </Fragment>
    ));
};
