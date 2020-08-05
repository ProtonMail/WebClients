import React, { useState, useMemo } from 'react';
import { c } from 'ttag';
import { DateInput, TimeInput, LinkButton } from 'react-components';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { MAXIMUM_DATE, MINIMUM_DATE } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';

import { getTimeInUtc, getDateTimeState, getDateTime } from '../eventForm/time';
import { EventModel } from '../../../interfaces/EventModel';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
import AllDayCheckbox from '../inputs/AllDayCheckbox';
import { getAllDayCheck } from '../eventForm/stateActions';
import TimezoneSelector from '../../TimezoneSelector';
import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';

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
        <div className="flex flex-column flex-wrap flex-items-start">
            <div className="flex flex-nowrap w100">
                <div>
                    <div className="flex flex-nowrap mb0-5">
                        <div className="flex">
                            <DateInput
                                id="startDate"
                                className="pm-field w-unset"
                                required
                                value={start.date}
                                onChange={handleChangeStartDate}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                min={MINIMUM_DATE}
                                max={MAXIMUM_DATE}
                            />
                        </div>
                        {!isAllDay ? (
                            <div className="flex">
                                <TimeInput
                                    id="startTime"
                                    className="ml0-5 w-unset"
                                    value={start.time}
                                    onChange={handleChangeStartTime}
                                />
                            </div>
                        ) : null}
                        {(showTzSelector || isCalendarTzSelected) && (
                            <div className="flex">
                                <TimezoneSelector
                                    className="pm-field ml0-5 w-unset"
                                    id="event-start-timezone-select"
                                    data-test-id="create-event-modal/start:time-zone-dropdown"
                                    timezone={start.tzid}
                                    onChange={handleChangeStart}
                                    date={startDateTime}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-nowrap mb0-5">
                        <div className="flex">
                            <DateInput
                                id="endDate"
                                className="pm-field"
                                required
                                value={end.date}
                                onChange={handleChangeEndDate}
                                aria-invalid={!!endError}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                min={minEndDate}
                                max={MAXIMUM_DATE}
                            />
                        </div>

                        {!isAllDay ? (
                            <div className="flex">
                                <TimeInput
                                    id="endTime"
                                    className="pm-field ml0-5"
                                    value={end.time}
                                    onChange={handleChangeEndTime}
                                    aria-invalid={!!endError}
                                    displayDuration={isDuration}
                                    min={minEndTime}
                                />
                            </div>
                        ) : null}
                        {(showTzSelector || isCalendarTzSelected) && (
                            <div className="flex">
                                <TimezoneSelector
                                    className="pm-field ml0-5"
                                    id="event-end-timezone-select"
                                    data-test-id="create-event-modal/end:time-zone-dropdown"
                                    timezone={end.tzid}
                                    onChange={handleChangeEnd}
                                    date={endDateTime}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {!isAllDay ? (
                    <div>
                        {!showTzSelector && start.tzid === tzid && (
                            <LinkButton
                                className="ml0-5"
                                data-test-id="show-tz"
                                onClick={() => setShowTzSelector(true)}
                            >{c('Action').t`Show time zones`}</LinkButton>
                        )}
                        {showTzSelector && start.tzid === tzid && end.tzid === tzid && (
                            <LinkButton
                                className="ml0-5"
                                data-test-id="hide-tz"
                                onClick={() => setShowTzSelector(false)}
                            >{c('Action').t`Hide`}</LinkButton>
                        )}
                    </div>
                ) : null}
            </div>

            <AllDayCheckbox
                className="mt0-75"
                checked={isAllDay}
                onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
            />
        </div>
    );
};

export default DateTimeRow;
