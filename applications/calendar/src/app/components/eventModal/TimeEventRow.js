import React from 'react';
import PropTypes from 'prop-types';
import { Label, Row, DateInput, TimeInput, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';
import { addDays, isSameDay } from 'date-fns';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromLocalDate, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTimeState } from './eventForm/state';
import { modelToDateProperty } from './eventForm/modelToProperties';

const getUTCDate = (start, isAllDay, defaultTzid) => {
    return propertyToUTCDate(modelToDateProperty({ ...start, isAllDay }, defaultTzid));
};

const getStartEndUTC = ([start, end], isAllDay, defaultTzid) => {
    return [getUTCDate(start, isAllDay, defaultTzid), getUTCDate(end, isAllDay, defaultTzid)];
};

const getMinEndTime = ([start, end], isAllDay, defaultTzid) => {
    if (isAllDay) {
        return [start.date];
    }
    const startUtcDate = propertyToUTCDate(modelToDateProperty({ ...start, isAllDay }, defaultTzid));

    const minLocalDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), end.tzid));
    const { date: minDate, time: minTime } = getDateTimeState(minLocalDate);

    // If the minDate with the currently selected end time would lead to an error, don't allow it to be selected
    const minTimeUtcDate = propertyToUTCDate(
        modelToDateProperty(
            {
                ...end,
                date: minDate,
                time: end.time,
                isAllDay
            },
            defaultTzid
        )
    );

    return [
        startUtcDate > minTimeUtcDate ? addDays(minDate, 1) : minDate,
        isSameDay(minDate, end.date) ? minTime : undefined
    ];
};

const TimeEventRow = ({
    model,
    model: { isAllDay, start, end, defaultTzid },
    setModel,
    errors,
    displayWeekNumbers,
    weekStartsOn
}) => {
    const { isNarrow } = useActiveBreakpoint();

    const handleStartUpdate = (newStart) => {
        const oldStartDate = toUTCDate({
            ...fromLocalDate(start.date),
            hours: start.time.getHours(),
            minutes: start.time.getMinutes()
        });
        const newStartDate = toUTCDate({
            ...fromLocalDate(newStart.date),
            hours: newStart.time.getHours(),
            minutes: newStart.time.getMinutes()
        });
        const difference = newStartDate - oldStartDate;
        const oldEndDate = toUTCDate({
            ...fromLocalDate(end.date),
            hours: end.time.getHours(),
            minutes: end.time.getMinutes()
        });
        const newEndDate = new Date(+oldEndDate + difference);
        const newEnd = getDateTimeState(newEndDate, end.tzid);
        setModel({
            ...model,
            start: newStart,
            end: newEnd
        });
    };

    const [minEndDate, minEndTime] = getMinEndTime([start, end], isAllDay, defaultTzid);

    const handleChangeStartDate = (newDate) => {
        handleStartUpdate({
            ...start,
            date: newDate
        });
    };

    const handleChangeStartTime = (newTime) => {
        handleStartUpdate({
            ...start,
            time: newTime
        });
    };

    const handleEndUpdate = (newEnd) => {
        const [startDate, endDate] = getStartEndUTC([start, newEnd], isAllDay, defaultTzid);
        if (startDate > endDate) {
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

    if (isNarrow) {
        return (
            <>
                <Row>
                    <Label htmlFor="startDate">{c('Label').t`From`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap">
                            <DateInput
                                id="startDate"
                                className="mr0-5"
                                required
                                value={start.date}
                                onChange={handleChangeStartDate}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                            />
                            {!isAllDay ? <TimeInput value={start.time} onChange={handleChangeStartTime} /> : null}
                        </div>
                    </div>
                </Row>
                <Row>
                    <Label htmlFor="endDate">{c('Label').t`To`}</Label>
                    <div className="flex-item-fluid">
                        <div className="flex flex-nowrap mb0-5">
                            <DateInput
                                id="endDate"
                                className="mr0-5"
                                required
                                value={end.date}
                                onChange={handleChangeEndDate}
                                aria-invalid={!!errors.end}
                                displayWeekNumbers={displayWeekNumbers}
                                min={minEndDate}
                            />
                            {!isAllDay ? (
                                <TimeInput
                                    value={end.time}
                                    onChange={handleChangeEndTime}
                                    aria-invalid={!!errors.end}
                                    min={minEndTime}
                                />
                            ) : null}
                        </div>
                    </div>
                </Row>
            </>
        );
    }

    return (
        <Row>
            <Label>{c('Label').t`Time`}</Label>
            <div className="flex-item-fluid">
                <div className="flex flex-nowrap flex-items-center">
                    <DateInput
                        id="startDate"
                        className="mr0-5"
                        required
                        value={start.date}
                        onChange={handleChangeStartDate}
                        aria-invalid={!!errors.start}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                    />
                    {!isAllDay ? (
                        <TimeInput
                            className="mr0-5"
                            value={start.time}
                            onChange={handleChangeStartTime}
                            aria-invalid={!!errors.start}
                        />
                    ) : null}
                    <span className="mr1">-</span>
                    <DateInput
                        id="endDate"
                        className="mr0-5"
                        required
                        value={end.date}
                        onChange={handleChangeEndDate}
                        aria-invalid={!!errors.end}
                        displayWeekNumbers={displayWeekNumbers}
                        min={minEndDate}
                    />
                    {!isAllDay ? (
                        <TimeInput
                            value={end.time}
                            onChange={handleChangeEndTime}
                            aria-invalid={!!errors.end}
                            min={minEndTime}
                        />
                    ) : null}
                </div>
            </div>
        </Row>
    );
};

TimeEventRow.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func.isRequired,
    errors: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number
};

export default TimeEventRow;
