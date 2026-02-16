import { type ReactNode, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import IconRow from '@proton/components/components/iconRow/MemoizedIconRow';
import DateInput from '@proton/components/components/input/DateInput';
import TimeInput from '@proton/components/components/input/TimeInput';
import TimeZoneSelector from '@proton/components/components/timezoneSelector/TimeZoneSelector';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { DATE_INPUT_ID, MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDateToTimezone } from '@proton/shared/lib/date/timezone';
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
    children?: ReactNode;
}

export const DateTimeRow = ({ model, setModel, displayWeekNumbers, weekStartsOn, endError, tzid, children }: Props) => {
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
        const newStartUtcDate = fromUTCDateToTimezone(startUtcDate, tzid);
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
        const newEndUtcDate = fromUTCDateToTimezone(endUtcDate, tzid);

        setModel({
            ...model,
            end: getDateTimeState(newEndUtcDate, tzid),
        });
    };

    const startDateTime = useMemo(() => getDateTime(start), [start]);
    const endDateTime = useMemo(() => getDateTime(end), [end]);

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <div className="flex justify-end">
                {!isAllDay &&
                    canToggleTzSelector &&
                    (showTzSelector ? (
                        <Button
                            shape="underline"
                            color="norm"
                            className="p-0 mb-2"
                            data-testid="hide-tz"
                            onClick={() => setShowTzSelector(false)}
                            title={c('Title').t`Hide time zones for event start and end times`}
                        >
                            {c('Action').t`Hide time zones`}
                        </Button>
                    ) : (
                        <Button
                            shape="underline"
                            color="norm"
                            className="p-0 mb-2"
                            data-testid="show-tz"
                            onClick={() => setShowTzSelector(true)}
                            title={c('Title').t`Show time zones for event start and end times`}
                        >
                            {c('Action').t`Show time zones`}
                        </Button>
                    ))}
            </div>
            <IconRow id={DATE_INPUT_ID} icon="clock" title={c('Label').t`Date and time`}>
                <div className={clsx([isAllDay && 'w-full md:w-1/2'])}>
                    <div className="flex flex-nowrap flex-column md:flex-row mb-2">
                        <div className="flex flex-nowrap md:flex-1 grow">
                            <div
                                className="flex *:min-size-auto flex-1 grow-custom"
                                style={{ '--grow-custom': '1.25' }}
                            >
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
                                    tzid={start.tzid}
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
                            <div
                                className="flex *:min-size-auto flex-1 grow-custom"
                                style={{ '--grow-custom': '1.25' }}
                            >
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
                                    tzid={end.tzid}
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

                <div className="eventpopover-fullday-recurrency mt-2 flex *:min-size-auto w-full flex-column items-center">
                    <span className="flex-0 text-nowrap">
                        <AllDayCheckbox
                            title={
                                model.isAllDay
                                    ? c('Title').t`Event is happening on defined time slot`
                                    : c('Title').t`Event is happening all day`
                            }
                            checked={isAllDay}
                            onChange={(isAllDay) =>
                                setModel({ ...model, ...getAllDayCheck({ oldModel: model, isAllDay }) })
                            }
                        />
                    </span>
                    <span className="mt-1 eventpopover-recurrency">{children}</span>
                </div>
            </IconRow>
        </>
    );
};
