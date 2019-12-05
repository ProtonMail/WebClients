import { DateInput, Label, Row, TimeInput } from 'react-components';
import React from 'react';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays, isSameDay } from 'date-fns';
import { getDateTimeState, getTimeInUtc } from '../eventForm/state';
import { c } from 'ttag';
import { getStartTimeChange } from '../eventForm/stateActions';

const getMinEndTime = (start, end, isAllDay) => {
    if (isAllDay) {
        return [start.date];
    }

    const startUtcDate = getTimeInUtc(start);

    const minLocalDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), end.tzid));
    const { date: minDate, time: minTime } = getDateTimeState(minLocalDate);

    // If the minDate with the currently selected end time would lead to an error, don't allow it to be selected
    const minTimeUtcDate = getTimeInUtc({ ...end, date: minDate, time: end.time });

    return [
        startUtcDate > minTimeUtcDate ? addDays(minDate, 1) : minDate,
        isSameDay(minDate, end.date) ? minTime : undefined
    ];
};

const DateTimeRow = ({
    collapseOnMobile,
    label,
    model,
    setModel,
    displayWeekNumbers,
    weekStartsOn,
    endError,
    isNarrow
}) => {
    const { isAllDay, start, end } = model;

    const [minEndDate, minEndTime] = getMinEndTime(start, end, isAllDay);

    const handleChangeStartDate = (newDate) => {
        setModel({
            ...model,
            ...getStartTimeChange(model, {
                ...start,
                date: newDate
            })
        });
    };

    const handleChangeStartTime = (newTime) => {
        setModel({
            ...model,
            ...getStartTimeChange(model, {
                ...start,
                time: newTime
            })
        });
    };

    const handleEndUpdate = (newEnd) => {
        const startTime = getTimeInUtc(start);
        const endTime = getTimeInUtc(newEnd);
        if (startTime > endTime) {
            return;
        }
        setModel({
            ...model,
            end: newEnd
        });
    };

    const handleChangeEndDate = (newDate) => {
        handleEndUpdate({
            ...end,
            date: newDate
        });
    };

    const handleChangeEndTime = (newTime) => {
        handleEndUpdate({
            ...end,
            time: newTime
        });
    };

    const startTimeInput = isAllDay ? null : (
        <TimeInput id="startTime" value={start.time} onChange={handleChangeStartTime} />
    );

    const endTimeInput = isAllDay ? null : (
        <TimeInput
            id="endTime"
            value={end.time}
            onChange={handleChangeEndTime}
            aria-invalid={!!endError}
            min={minEndTime}
        />
    );

    const startDateInput = (
        <DateInput
            id="startDate"
            className="mr0-5"
            required
            value={start.date}
            onChange={handleChangeStartDate}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
        />
    );

    const endDateInput = (
        <DateInput
            id="endDate"
            className="mr0-5"
            required
            value={end.date}
            onChange={handleChangeEndDate}
            aria-invalid={!!endError}
            displayWeekNumbers={displayWeekNumbers}
            min={minEndDate}
        />
    );

    if (isNarrow) {
        return (
            <>
                <Row collapseOnMobile={collapseOnMobile}>
                    <Label htmlFor="startDate">{c('Label').t`From`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap">
                            {startDateInput}
                            {startTimeInput}
                        </div>
                    </div>
                </Row>
                <Row collapseOnMobile={collapseOnMobile}>
                    <Label htmlFor="endDate">{c('Label').t`To`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap mb0-5">
                            {endDateInput}
                            {endTimeInput}
                        </div>
                    </div>
                </Row>
            </>
        );
    }

    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label>{label}</Label>
            <div className="flex-item-fluid">
                <div className="flex flex-nowrap flex-items-center">
                    <div className="flex flex-nowrap">
                        {startDateInput}
                        {startTimeInput}
                    </div>
                    <div className="aligncenter" style={{width: '2em'}}>-</div>
                    <div className="flex flex-nowrap">
                        {endDateInput}
                        {endTimeInput}
                    </div>
                </div>
            </div>
        </Row>
    );
};

export default DateTimeRow;
