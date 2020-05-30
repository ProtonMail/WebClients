import React from 'react';
import { DateInput, Label, Row, TimeInput, classnames } from 'react-components';
import { WeekStartsOn } from '../../../containers/calendar/interface';

import { MAXIMUM_DATE, MINIMUM_DATE } from '../../../constants';
import { EventModel } from '../../../interfaces/EventModel';
import useDateTimeFormHandlers from '../hooks/useDateTimeFormHandlers';

interface Props {
    collapseOnMobile?: boolean;
    label: React.ReactNode;
    model: EventModel;
    setModel: (value: EventModel) => void;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    endError?: string;
    isNarrow?: boolean;
}

const DateTimeRow = ({
    collapseOnMobile,
    label,
    model,
    setModel,
    displayWeekNumbers,
    weekStartsOn,
    endError,
}: Props) => {
    const {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndDate,
        handleChangeEndTime,
        minEndDate,
        minEndTime,
        isDuration,
    } = useDateTimeFormHandlers({ model, setModel });

    const startTimeInput = model.isAllDay ? null : (
        <TimeInput id="startTime" className="ml0-5" value={model.start.time} onChange={handleChangeStartTime} />
    );

    const endTimeInput = model.isAllDay ? null : (
        <TimeInput
            id="endTime"
            className="ml0-5"
            value={model.end.time}
            onChange={handleChangeEndTime}
            aria-invalid={!!endError}
            displayDuration={isDuration}
            min={minEndTime}
        />
    );

    const startDateInput = (
        <DateInput
            id="startDate"
            className={classnames([!model.isAllDay && 'mr0-5'])}
            required
            value={model.start.date}
            onChange={handleChangeStartDate}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            min={MINIMUM_DATE}
            max={MAXIMUM_DATE}
        />
    );

    const endDateInput = (
        <DateInput
            id="endDate"
            className={classnames([!model.isAllDay && 'mr0-5'])}
            required
            value={model.end.date}
            onChange={handleChangeEndDate}
            aria-invalid={!!endError}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            min={minEndDate}
            max={MAXIMUM_DATE}
        />
    );

    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label>{label}</Label>
            <div className="flex-item-fluid">
                <div className="flex flex-wrap flex-items-center">
                    <div className="flex flex-nowrap w100 mb0-5">
                        {startDateInput}
                        {startTimeInput}
                    </div>
                    <div className="flex flex-nowrap w100">
                        {endDateInput}
                        {endTimeInput}
                    </div>
                </div>
            </div>
        </Row>
    );
};

export default DateTimeRow;
