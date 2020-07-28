import React, { useState, useMemo } from 'react';
import { c } from 'ttag';
import { DateInput, TimeInput, LinkButton } from 'react-components';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';

import { MAXIMUM_DATE, MINIMUM_DATE } from '../../../constants';
import { EventModel } from '../../../interfaces/EventModel';
import { WeekStartsOn } from '../../../containers/calendar/interface';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
import AllDayCheckbox from '../inputs/AllDayCheckbox';
import { getAllDayCheck } from '../eventForm/stateActions';
import TimezoneSelector from '../../TimezoneSelector';
import { getDateTime, getDateTimeState, getTimeInUtc } from '../eventForm/time';
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
        const startUtcDate = getTimeInUtc(model.start, false);
        const newStartUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), tzid));
        const newStart = getDateTimeState(newStartUtcDate, tzid);
        const newFrequencyModel = getFrequencyModelChange(model.start, newStart, model.frequencyModel);

        setModel({
            ...model,
            start: newStart,
            frequencyModel: newFrequencyModel,
        });
    };
    const handleChangeEnd = (tzid: string) => {
        const endUtcDate = getTimeInUtc(model.end, false);
        const newEndUtcDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(endUtcDate), tzid));

        setModel({
            ...model,
            end: getDateTimeState(newEndUtcDate, tzid),
        });
    };

    const startDateTime = useMemo(() => getDateTime(model.start), [model.start]);
    const endDateTime = useMemo(() => getDateTime(model.end), [model.end]);
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
                                value={model.start.date}
                                onChange={handleChangeStartDate}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                min={MINIMUM_DATE}
                                max={MAXIMUM_DATE}
                            />
                        </div>
                        {!model.isAllDay ? (
                            <div className="flex">
                                <TimeInput
                                    id="startTime"
                                    className="ml0-5 w-unset"
                                    value={model.start.time}
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
                                    timezone={model.start.tzid}
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
                                value={model.end.date}
                                onChange={handleChangeEndDate}
                                aria-invalid={!!endError}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                min={minEndDate}
                                max={MAXIMUM_DATE}
                            />
                        </div>

                        {!model.isAllDay ? (
                            <div className="flex">
                                <TimeInput
                                    id="endTime"
                                    className="pm-field ml0-5"
                                    value={model.end.time}
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
                                    timezone={model.end.tzid}
                                    onChange={handleChangeEnd}
                                    date={endDateTime}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    {!showTzSelector && model.start.tzid === tzid && (
                        <LinkButton
                            className="capitalize no-wrap ml0-5"
                            data-test-id="show-tz"
                            onClick={() => setShowTzSelector(true)}
                        >{c('Action').t`Show time zones`}</LinkButton>
                    )}
                    {showTzSelector && model.start.tzid === tzid && model.end.tzid === tzid && (
                        <LinkButton
                            className="capitalize no-wrap ml0-5"
                            data-test-id="hide-tz"
                            onClick={() => setShowTzSelector(false)}
                        >{c('Action').t`Hide`}</LinkButton>
                    )}
                </div>
            </div>

            <AllDayCheckbox
                className="mt0-75"
                checked={model.isAllDay}
                onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
            />
        </div>
    );
};

export default DateTimeRow;
