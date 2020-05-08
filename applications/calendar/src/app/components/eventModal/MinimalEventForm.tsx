import React from 'react';
import { c } from 'ttag';
import { Icon, Row } from 'react-components';

import AllDayCheckbox from './inputs/AllDayCheckbox';
import CalendarSelectRow from './rows/CalendarSelectRow';
import LocationRow from './rows/LocationRow';
import DescriptionRow from './rows/DescriptionRow';
import DateTimeRow from './rows/DateTimeRow';
import TitleRow from './rows/TitleRow';
import FrequencyRow from './rows/FrequencyRow';
import { getAllDayCheck } from './eventForm/stateActions';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { WeekStartsOn } from '../../containers/calendar/interface';

interface Props {
    isSubmitted: boolean;
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const MinimalEventForm = ({
    isSubmitted,
    isNarrow,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    model,
    setModel
}: Props) => {
    const allDayRow = (
        <Row collapseOnMobile={false}>
            <span className="pm-label" />
            <div className="flex-item-fluid">
                <AllDayCheckbox
                    className="mb1"
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </div>
        </Row>
    );

    const frequencyRow = model.hasFrequencyRow ? (
        <FrequencyRow
            collapseOnMobile={false}
            label={
                <>
                    <Icon name="calendar-repeat" />
                    <span className="sr-only">{c('Label').t`Frequency`}</span>
                </>
            }
            frequencyModel={model.frequencyModel}
            start={model.start}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            errors={errors}
            isSubmitted={isSubmitted}
            onChange={(frequencyModel) => setModel({ ...model, frequencyModel })}
        />
    ) : null;

    const calendarRow = model.calendars.length ? (
        <CalendarSelectRow
            collapseOnMobile={false}
            label={
                <>
                    <Icon name="calendar" color={model.calendar.color} />
                    <span className="sr-only">{c('Label').t`Calendar`}</span>
                </>
            }
            model={model}
            setModel={setModel}
            withIcon={true}
            disabled={!model.hasCalendarRow}
        />
    ) : null;

    return (
        <>
            <TitleRow
                collapseOnMobile={false}
                label={
                    <>
                        <Icon name="circle" color={model.calendar.color} />
                        <span className="sr-only">{c('Label').t`Title`}</span>
                    </>
                }
                type={model.type}
                value={model.title}
                error={errors.title}
                onChange={(value) => setModel({ ...model, title: value })}
                isSubmitted={isSubmitted}
            />
            {allDayRow}
            <DateTimeRow
                collapseOnMobile={false}
                label={<Icon name="clock" />}
                model={model}
                setModel={setModel}
                endError={errors.end}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isNarrow={isNarrow}
            />
            {frequencyRow}
            {calendarRow}
            <LocationRow
                collapseOnMobile={false}
                label={
                    <>
                        <Icon name="address" />
                        <span className="sr-only">{c('Label').t`Location`}</span>
                    </>
                }
                value={model.location}
                onChange={(location) => setModel({ ...model, location })}
            />
            <DescriptionRow
                collapseOnMobile={false}
                label={
                    <>
                        <Icon name="note" />
                        <span className="sr-only">{c('Label').t`Description`}</span>
                    </>
                }
                value={model.description}
                onChange={(description) => setModel({ ...model, description })}
            />
        </>
    );
};

export default MinimalEventForm;
