import { ReactNode } from 'react';

import { c } from 'ttag';

import { DateInput, MemoizedIconRow as IconRow, TimeInput } from '@proton/components';
import { DATE_INPUT_ID, MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

import { getAllDayCheck } from '../eventForm/stateActions';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';
import AllDayCheckbox from '../inputs/AllDayCheckbox';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    endError?: string;
    children?: ReactNode;
}

const MiniDateTimeRows = ({ model, setModel, displayWeekNumbers, weekStartsOn, endError, children }: Props) => {
    const {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndDate,
        handleChangeEndTime,
        isDuration,
        minEndTime,
        minEndDate,
    } = useDateTimeFormHandlers({ model, setModel });

    return (
        <IconRow id={DATE_INPUT_ID} icon="clock" title={c('Label').t`Date and time`}>
            <div>
                <div className="flex flex-nowrap mb-2">
                    <div
                        className="flex *:min-size-auto flex-1 flex-column grow-custom"
                        style={{ '--grow-custom': '1.35' }}
                    >
                        <DateInput
                            id={DATE_INPUT_ID}
                            className="flex-1"
                            required
                            value={model.start.date}
                            onChange={handleChangeStartDate}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            min={MINIMUM_DATE}
                            max={MAXIMUM_DATE}
                            title={c('Title').t`Select event start date`}
                        />
                    </div>
                    {!model.isAllDay && (
                        <TimeInput
                            id="event-startTime"
                            className="ml-2 flex-1"
                            value={model.start.time}
                            onChange={handleChangeStartTime}
                            title={c('Title').t`Select event start time`}
                        />
                    )}
                </div>
                <div className="flex flex-nowrap mb-1">
                    <div
                        className="flex *:min-size-auto flex-1 flex-column grow-custom"
                        style={{ '--grow-custom': '1.35' }}
                    >
                        <DateInput
                            id="event-endDate"
                            className="flex-1"
                            required
                            value={model.end.date}
                            onChange={handleChangeEndDate}
                            aria-invalid={!!endError}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            min={minEndDate}
                            max={MAXIMUM_DATE}
                            title={c('Title').t`Select event end date`}
                        />
                    </div>
                    {!model.isAllDay && (
                        <TimeInput
                            id="event-endTime"
                            className="ml-2 flex-1"
                            value={model.end.time}
                            onChange={handleChangeEndTime}
                            aria-invalid={Boolean(endError)}
                            displayDuration={isDuration}
                            min={minEndTime}
                            title={c('Title').t`Select event end time`}
                        />
                    )}
                </div>
            </div>

            <div className="eventpopover-fullday-recurrency mt-2 flex *:min-size-auto w-full flex-column">
                <span className="flex-0 mr-2">
                    <AllDayCheckbox
                        title={
                            model.isAllDay
                                ? c('Title').t`Event is happening on defined time slot`
                                : c('Title').t`Event is happening all day`
                        }
                        checked={model.isAllDay}
                        onChange={(isAllDay) =>
                            setModel({ ...model, ...getAllDayCheck({ oldModel: model, isAllDay }) })
                        }
                    />
                </span>
                <span className="mt-1 eventpopover-recurrency">{children}</span>
            </div>
        </IconRow>
    );
};
export default MiniDateTimeRows;
