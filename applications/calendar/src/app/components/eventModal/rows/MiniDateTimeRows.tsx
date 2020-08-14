import { isSameDay } from 'date-fns';
import { MAXIMUM_DATE, MINIMUM_DATE } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React from 'react';
import { classnames, DateInput, TimeInput } from 'react-components';
import { EventModel } from '../../../interfaces/EventModel';
import { EnDash } from '../../EnDash';
import { ALL_DAY_INPUT_ID, DATE_INPUT_ID } from '../const';
import { getAllDayCheck } from '../eventForm/stateActions';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
import IconRow from '../IconRow';
import AllDayCheckbox from '../inputs/AllDayCheckbox';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    endError?: string;
}

const MiniDateTimeRows = ({ model, setModel, displayWeekNumbers, weekStartsOn, endError }: Props) => {
    const {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndDate,
        handleChangeEndTime,
        isDuration,
        minEndTime,
        minEndDate,
    } = useDateTimeFormHandlers({ model, setModel });
    const endsOnSameDay = isSameDay(model.start.date, model.end.date);
    return (
        <>
            <IconRow id={DATE_INPUT_ID} icon="clock" className="flex flex-nowrap flex-row flex-items-center w100">
                <DateInput
                    id="startDate"
                    className={classnames([!model.isAllDay && 'mr0-5', 'flex-item-fluid', 'flex-item-grow-2'])}
                    required
                    value={model.start.date}
                    onChange={handleChangeStartDate}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    min={MINIMUM_DATE}
                    max={MAXIMUM_DATE}
                />
                {model.isAllDay && !endsOnSameDay && (
                    <>
                        <EnDash />
                        <DateInput
                            id="endDate"
                            className={classnames([!model.isAllDay && 'mr0-5', 'flex-item-fluid', 'flex-item-grow-2'])}
                            required
                            value={model.end.date}
                            onChange={handleChangeEndDate}
                            aria-invalid={!!endError}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            min={minEndDate}
                            max={MAXIMUM_DATE}
                        />
                    </>
                )}
                {!model.isAllDay && (
                    <TimeInput
                        className="flex-item-fluid"
                        id="startTime"
                        value={model.start.time}
                        onChange={handleChangeStartTime}
                    />
                )}
            </IconRow>
            {!model.isAllDay && (
                <IconRow className="flex flex-nowrap flex-row flex-items-center w100">
                    <DateInput
                        id="endDate"
                        className={classnames([!model.isAllDay && 'mr0-5', 'flex-item-fluid', 'flex-item-grow-2'])}
                        required
                        value={model.end.date}
                        onChange={handleChangeEndDate}
                        aria-invalid={!!endError}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                        min={minEndDate}
                        max={MAXIMUM_DATE}
                    />
                    <TimeInput
                        id="endTime"
                        className="flex-item-fluid"
                        value={model.end.time}
                        onChange={handleChangeEndTime}
                        aria-invalid={Boolean(endError)}
                        displayDuration={isDuration}
                        min={minEndTime}
                    />
                </IconRow>
            )}
            <IconRow id={ALL_DAY_INPUT_ID}>
                <AllDayCheckbox
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </IconRow>
        </>
    );
};
export default MiniDateTimeRows;
