import { MAXIMUM_DATE, MINIMUM_DATE } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import React, { useMemo, useState } from 'react';
import { DateInput, LinkButton, TimeInput, classnames } from 'react-components';
import { c } from 'ttag';
import { EventModel } from '../../../interfaces/EventModel';
import { DATE_INPUT_ID } from '../const';
import TimezoneSelector from '../../TimezoneSelector';
import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';
import { getAllDayCheck } from '../eventForm/stateActions';
import { getDateTime, getDateTimeState, getTimeInUtc } from '../eventForm/time';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
import IconRow from '../IconRow';
import AllDayCheckbox from '../inputs/AllDayCheckbox';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    endError?: string;
    tzid: string;
}

const DateTimeRow = ({ model, setModel, displayWeekNumbers, weekStartsOn, endError, tzid }: Props) => {
    const { start, end, frequencyModel, isAllDay } = model;
    const {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndDate,
        handleChangeEndTime,
        minEndDate,
        minEndTime,
        isDuration,
    } = useDateTimeFormHandlers({ model, setModel });
    const [showTzSelector, setShowTzSelector] = useState(false);
    const handleChangeStart = (tzid: string) => {
        const startUtcDate = getTimeInUtc(start, false);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        const newStart = getDateTimeState(newStartUtcDate, tzid);
        const newFrequencyModel = getFrequencyModelChange(start, newStart, frequencyModel);

        setModel({
            ...model,
            start: newStart,
            frequencyModel: newFrequencyModel,
        });
    };
    const handleChangeEnd = (tzid: string) => {
        const endUtcDate = getTimeInUtc(end, false);
        const newEndUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(endUtcDate), tzid));

        setModel({
            ...model,
            end: getDateTimeState(newEndUtcDate, tzid),
        });
    };

    const startDateTime = useMemo(() => getDateTime(start), [start]);
    const endDateTime = useMemo(() => getDateTime(end), [end]);
    const isCalendarTzSelected = model.start.tzid !== tzid || model.end.tzid !== tzid;
    return (
        <IconRow id={DATE_INPUT_ID} icon="clock" title={c('Label').t`Time of the event`}>
            <div className={classnames([isAllDay && 'w50 onmobile-w100'])}>
                <div className="flex flex-nowrap onmobile-flex-column mb0-5">
                    <div className="flex flex-nowrap flex-item-fluid flex-item-grow-2">
                        <DateInput
                            id={DATE_INPUT_ID}
                            className="flex-item-fluid flex-item-grow-2"
                            required
                            value={start.date}
                            onChange={handleChangeStartDate}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            min={MINIMUM_DATE}
                            max={MAXIMUM_DATE}
                            title={c('Title').t`Select event start date`}
                        />

                        {!isAllDay && (
                            <TimeInput
                                id="event-startTime"
                                className="ml0-5 flex-item-fluid"
                                value={start.time}
                                onChange={handleChangeStartTime}
                                title={c('Title').t`Select event start time`}
                            />
                        )}
                    </div>

                    {!isAllDay && (showTzSelector || isCalendarTzSelected) && (
                        <TimezoneSelector
                            className="pm-field ml0-5 onmobile-ml0 onmobile-mt0-5 onmobile-mb0-5 flex-item-fluid"
                            id="event-start-timezone-select"
                            data-test-id="create-event-modal/start:time-zone-dropdown"
                            timezone={start.tzid}
                            onChange={handleChangeStart}
                            date={startDateTime}
                            title={c('Title').t`Select the time zone for the event start time`}
                        />
                    )}
                </div>

                <div className="flex flex-nowrap onmobile-flex-column mb0-5">
                    <div className="flex flex-nowrap flex-item-fluid flex-item-grow-2">
                        <DateInput
                            id="event-endDate"
                            className="flex-item-fluid flex-item-grow-2"
                            required
                            value={end.date}
                            onChange={handleChangeEndDate}
                            aria-invalid={!!endError}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            min={minEndDate}
                            max={MAXIMUM_DATE}
                            title={c('Title').t`Select event end date`}
                        />

                        {!isAllDay && (
                            <TimeInput
                                id="event-endTime"
                                className="ml0-5 flex-item-fluid"
                                value={end.time}
                                onChange={handleChangeEndTime}
                                aria-invalid={!!endError}
                                displayDuration={isDuration}
                                min={minEndTime}
                                title={c('Title').t`Select event end time`}
                            />
                        )}
                    </div>

                    {!isAllDay && (showTzSelector || isCalendarTzSelected) && (
                        <TimezoneSelector
                            className="pm-field ml0-5 onmobile-ml0 onmobile-mt0-5 onmobile-mb0-5 flex-item-fluid"
                            id="event-end-timezone-select"
                            data-test-id="create-event-modal/end:time-zone-dropdown"
                            timezone={end.tzid}
                            onChange={handleChangeEnd}
                            date={endDateTime}
                            title={c('Title').t`Select the time zone for the event end time`}
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-spacebetween">
                <AllDayCheckbox
                    title={
                        model.isAllDay
                            ? c('Title').t`Event is happening on defined time slot`
                            : c('Title').t`Event is happening all day`
                    }
                    checked={isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />

                {!isAllDay && (
                    <>
                        {!showTzSelector && start.tzid === tzid && (
                            <LinkButton
                                className="p0"
                                data-test-id="show-tz"
                                onClick={() => setShowTzSelector(true)}
                                title={c('Title').t`Show time zones for event start and end times`}
                            >
                                {c('Action').t`Show time zones`}
                            </LinkButton>
                        )}

                        {showTzSelector && start.tzid === tzid && end.tzid === tzid && (
                            <LinkButton
                                className="p0"
                                data-test-id="hide-tz"
                                onClick={() => setShowTzSelector(false)}
                                title={c('Title').t`Hide time zones for the event start and end times`}
                            >
                                {c('Action').t`Hide time zones`}
                            </LinkButton>
                        )}
                    </>
                )}
            </div>
        </IconRow>
    );
};

export default DateTimeRow;
