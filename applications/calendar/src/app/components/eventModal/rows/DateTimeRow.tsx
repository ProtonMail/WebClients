import { MAXIMUM_DATE, MINIMUM_DATE, DATE_INPUT_ID } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { useMemo, useState } from 'react';

import {
    DateInput,
    UnderlineButton,
    TimeInput,
    classnames,
    TimeZoneSelector,
    MemoizedIconRow as IconRow,
} from '@proton/components';
import { c } from 'ttag';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';
import { getAllDayCheck } from '../eventForm/stateActions';
import { getDateTime, getDateTimeState, getTimeInUtc } from '../eventForm/time';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
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
    const canToggleTzSelector = start.tzid === end.tzid && start.tzid === tzid;
    const [showTzSelector, setShowTzSelector] = useState<boolean>(!canToggleTzSelector);
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

    return (
        <IconRow id={DATE_INPUT_ID} icon="clock" title={c('Label').t`Date and time`}>
            <div className={classnames([isAllDay && 'w50 on-mobile-w100'])}>
                <div className="flex flex-nowrap on-mobile-flex-column mb0-5">
                    <div className="flex flex-nowrap flex-item-fluid flex-item-grow">
                        <div className="flex-no-min-children flex-item-fluid flex-item-grow-2 on-tiny-mobile-flex-item-grow-1-5">
                            <DateInput
                                id={DATE_INPUT_ID}
                                className="flex-item-fluid"
                                required
                                value={start.date}
                                onChange={handleChangeStartDate}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                min={MINIMUM_DATE}
                                max={MAXIMUM_DATE}
                                title={c('Title').t`Select event start date`}
                            />
                        </div>

                        {!isAllDay && (
                            <div className="ml0-5 flex-item-fluid">
                                <TimeInput
                                    id="event-startTime"
                                    value={start.time}
                                    onChange={handleChangeStartTime}
                                    title={c('Title').t`Select event start time`}
                                />
                            </div>
                        )}
                    </div>

                    {!isAllDay && showTzSelector && (
                        <TimeZoneSelector
                            className="field ml0-5 on-mobile-ml0 on-mobile-mt0-5 on-mobile-mb0-5 flex-item-fluid"
                            id="event-start-timezone-select"
                            data-test-id="create-event-modal/start:time-zone-dropdown"
                            timezone={start.tzid}
                            onChange={handleChangeStart}
                            date={startDateTime}
                            title={c('Title').t`Select the time zone for the event start time`}
                        />
                    )}
                </div>

                <div className="flex flex-nowrap on-mobile-flex-column mb0-5">
                    <div className="flex flex-nowrap flex-item-fluid flex-item-grow">
                        <div className="flex-no-min-children flex-item-fluid flex-item-grow-2 on-tiny-mobile-flex-item-grow-1-5">
                            <DateInput
                                id="event-endDate"
                                className="flex-item-fluid"
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
                        </div>

                        {!isAllDay && (
                            <div className="ml0-5 flex-item-fluid">
                                <TimeInput
                                    id="event-endTime"
                                    value={end.time}
                                    onChange={handleChangeEndTime}
                                    aria-invalid={!!endError}
                                    displayDuration={isDuration}
                                    min={minEndTime}
                                    title={c('Title').t`Select event end time`}
                                />
                            </div>
                        )}
                    </div>

                    {!isAllDay && showTzSelector && (
                        <TimeZoneSelector
                            className="field ml0-5 on-mobile-ml0 on-mobile-mt0-5 on-mobile-mb0-5 flex-item-fluid"
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

            <div className="flex flex-justify-space-between">
                <AllDayCheckbox
                    title={
                        model.isAllDay
                            ? c('Title').t`Event is happening on defined time slot`
                            : c('Title').t`Event is happening all day`
                    }
                    checked={isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck({ oldModel: model, isAllDay }) })}
                />

                {!isAllDay &&
                    canToggleTzSelector &&
                    (showTzSelector ? (
                        <UnderlineButton
                            className="p0"
                            data-test-id="hide-tz"
                            onClick={() => setShowTzSelector(false)}
                            title={c('Title').t`Hide time zones for event start and end times`}
                        >
                            {c('Action').t`Hide time zones`}
                        </UnderlineButton>
                    ) : (
                        <UnderlineButton
                            className="p0"
                            data-test-id="show-tz"
                            onClick={() => setShowTzSelector(true)}
                            title={c('Title').t`Show time zones for event start and end times`}
                        >
                            {c('Action').t`Show time zones`}
                        </UnderlineButton>
                    ))}
            </div>
        </IconRow>
    );
};

export default DateTimeRow;
