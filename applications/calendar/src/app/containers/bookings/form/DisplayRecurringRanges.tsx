import { Fragment } from 'react';

import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { BookingFormData, BookingRange, RecurringRangeDisplay } from '../interface';
import { wouldOverflowDay } from '../utils/form/formHelpers';
import { generateRecurringRanges } from '../utils/range/rangeHelpers';
import {
    AddButton,
    EndTimeInput,
    RangeEndTimeLabel,
    RangeErrors,
    RangeStartTimeLabel,
    RemoveButton,
    StartTimeInput,
} from './FormRangeListShared';

import './DisplayRecurringRanges.scss';

interface Props {
    formData: BookingFormData;
    userSettings: UserSettings;
    onStartChange: (range: BookingRange, value: Date) => void;
    onEndChange: (range: BookingRange, value: Date) => void;
    removeBookingRange: (id: string) => void;
    onPlusClick: (range: BookingRange) => void;
    onAddRange: (date: Date) => void;
    hasReachedMaxSlots: boolean;
}

export const DisplayRecurringRanges = ({
    formData,
    userSettings,
    onStartChange,
    onEndChange,
    removeBookingRange,
    onPlusClick,
    onAddRange,
    hasReachedMaxSlots,
}: Props) => {
    const now = new Date();
    const ranges = generateRecurringRanges(userSettings, now, formData.bookingRanges);

    const formatter = new Intl.DateTimeFormat(dateLocale.code, {
        weekday: 'short',
    });

    const isPlusDisabled = (day: RecurringRangeDisplay) => {
        const lastRange = day.ranges[day.ranges.length - 1];
        return wouldOverflowDay(lastRange);
    };

    return (
        <div>
            {ranges.map((day) => {
                const formatterLabel = formatter.format(day.date);

                if (day.ranges && day.ranges.length > 0) {
                    return day.ranges.map((range, index) => (
                        <Fragment key={range.id}>
                            <div className="day-grid grid grid-cols-4 gap-1 items-center mb-1">
                                <p
                                    className={clsx(
                                        index !== 0 && 'visibility-hidden',
                                        'text-semibold color-weak text-sm m-0'
                                    )}
                                >
                                    {formatterLabel}
                                </p>
                                <div className="m-0 relative">
                                    <RangeStartTimeLabel htmlFor={`recurring-range-start-time-${day.id}`} />
                                    <StartTimeInput
                                        id={`recurring-range-start-time-${day.id}`}
                                        range={range}
                                        duration={formData.duration}
                                        onChange={(value) => onStartChange(range, value)}
                                        recurring
                                    />
                                </div>
                                <div className="m-0 relative">
                                    <RangeEndTimeLabel htmlFor={`recurring-range-end-time-${day.id}`} />
                                    <EndTimeInput
                                        id={`recurring-range-end-time-${day.id}`}
                                        range={range}
                                        duration={formData.duration}
                                        onChange={(value) => onEndChange(range, value)}
                                        recurring
                                    />
                                </div>
                                <div className="flex flex-nowrap shrink-0">
                                    <AddButton
                                        disabled={isPlusDisabled(day) || hasReachedMaxSlots}
                                        onClick={() => onPlusClick(range)}
                                        btnClassName={clsx(index !== 0 && 'visibility-hidden')}
                                    />
                                    <RemoveButton onClick={() => removeBookingRange(range.id)} />
                                </div>
                            </div>

                            {/* Recreate a grid to properly align the error message */}
                            <div className="day-grid grid grid-cols-4 gap-1 items-center mb-1">
                                <span></span>
                                <RangeErrors range={range} />
                            </div>
                        </Fragment>
                    ));
                }

                return (
                    <div className="day-grid grid grid-cols-4 gap-1 items-center mb-2" key={day.id}>
                        <p className="text-semibold m-0 mr-1 color-weak text-sm">{formatterLabel}</p>
                        <p className="m-0 color-weak text-sm flex items-center">{c('Label').t`Unavailable`}</p>
                        <p className="m-0 color-weak" />
                        <div className="flex flex-nowrap shrink-0">
                            <AddButton onClick={() => onAddRange(day.date)} disabled={hasReachedMaxSlots} />
                            <RemoveButton onClick={noop} btnClassName="visibility-hidden" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
