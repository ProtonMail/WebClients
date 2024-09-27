import { useMemo, useState } from 'react';

import { c } from 'ttag';

import {
    DateInput,
    MemoizedIconRow as IconRow,
    TimeInput,
    TimeZoneSelector,
    UnderlineButton,
    useActiveBreakpoint,
} from '@proton/components';
import { DATE_INPUT_ID, MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

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

export const DateTimeRow = ({ model, setModel, displayWeekNumbers, weekStartsOn, endError, tzid }: Props) => {
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

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <IconRow id={DATE_INPUT_ID} icon="clock" title={c('Label').t`Date and time`}>
            <div className={clsx([isAllDay && 'w-full md:w-1/2'])}>
                <div className="flex flex-nowrap flex-column md:flex-row mb-2">
                    <div className="flex flex-nowrap md:flex-1 grow">
                        <div className="flex *:min-size-auto flex-1 grow-custom" style={{ '--grow-custom': '1.25' }}>
                            <DateInput
                                id={DATE_INPUT_ID}
                                className={clsx(['flex-1', viewportWidth['<=small'] && 'h-full'])}
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
                            <div className="ml-2 flex-1">
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
                            className="field ml-0 md:ml-2 mt-2 md:mt-0 mb-2 md:mb-2 md:flex-1"
                            id="event-start-timezone-select"
                            data-testid="create-event-modal/start:time-zone-dropdown"
                            timezone={start.tzid}
                            onChange={handleChangeStart}
                            date={startDateTime}
                            title={c('Title').t`Select the time zone for the event start time`}
                            telemetrySource="event_start"
                        />
                    )}
                </div>

                <div className="flex flex-nowrap flex-column md:flex-row mb-2">
                    <div className="flex flex-nowrap md:flex-1 grow">
                        <div className="flex *:min-size-auto flex-1 grow-custom" style={{ '--grow-custom': '1.25' }}>
                            <DateInput
                                id="event-endDate"
                                className={clsx(['flex-1', viewportWidth['<=small'] && 'h-full'])}
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
                            <div className="ml-2 flex-1">
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
                            className="field ml-0 md:ml-2 mt-2 md:mt-0 mb-2 md:mb-2 md:flex-1"
                            id="event-end-timezone-select"
                            data-testid="create-event-modal/end:time-zone-dropdown"
                            timezone={end.tzid}
                            onChange={handleChangeEnd}
                            date={endDateTime}
                            title={c('Title').t`Select the time zone for the event end time`}
                            telemetrySource="event_end"
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-space-between gap-2">
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
                            className="p-0"
                            data-testid="hide-tz"
                            onClick={() => setShowTzSelector(false)}
                            title={c('Title').t`Hide time zones for event start and end times`}
                        >
                            {c('Action').t`Hide time zones`}
                        </UnderlineButton>
                    ) : (
                        <UnderlineButton
                            className="p-0"
                            data-testid="show-tz"
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
