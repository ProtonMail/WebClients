import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import AllDayCheckbox from './inputs/AllDayCheckbox';
import CalendarSelectRow from './rows/CalendarSelectRow';
import LocationRow from './rows/LocationRow';
import DescriptionRow from './rows/DescriptionRow';
import TimezoneRow from './rows/TimezoneRow';
import MoreRow from './rows/MoreRow';
import DateTimeRow from './rows/DateTimeRow';
import TitleRow from './rows/TitleRow';
import { getAllDayCheck } from './eventForm/stateActions';

const MinimalEventForm = ({ isSubmitted, isNarrow, displayWeekNumbers, weekStartsOn, errors, model, setModel }) => {
    const timezoneRows =
        model.hasMoreOptions && !model.isAllDay ? (
            <TimezoneRow
                collapseOnMobile={false}
                startLabel={<Icon name="timezone1" />}
                endLabel={<Icon name="timezone1" />}
                start={model.start}
                end={model.end}
                onChangeStart={(start) => setModel({ ...model, start })}
                onChangeEnd={(end) => setModel({ ...model, end })}
            />
        ) : null;

    const calendarRow = model.calendars.length ? (
        <CalendarSelectRow
            collapseOnMobile={false}
            label={<Icon name="calendar" />}
            options={model.calendars}
            value={model.calendar}
            onChange={({ id, color }) => setModel({ ...model, calendar: { id, color } })}
            withIcon={true}
        />
    ) : null;

    return (
        <>
            <TitleRow
                collapseOnMobile={false}
                label={<Icon name="circle" />}
                type={model.type}
                value={model.title}
                error={errors.title}
                onChange={(value) => setModel({ ...model, title: value })}
                isSubmitted={isSubmitted}
            />
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
            <MoreRow
                collapseOnMobile={false}
                displayMore={!model.isAllDay}
                hasMore={model.hasMoreOptions}
                onChange={(hasMoreOptions) => setModel({ ...model, hasMoreOptions })}
            >
                <AllDayCheckbox
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </MoreRow>
            {timezoneRows}
            {calendarRow}
            <LocationRow
                collapseOnMobile={false}
                label={<Icon name="address" />}
                value={model.location}
                onChange={(location) => setModel({ ...model, location })}
            />
            <DescriptionRow
                collapseOnMobile={false}
                label={<Icon name="note" />}
                value={model.description}
                onChange={(description) => setModel({ ...model, description })}
            />
        </>
    );
};

MinimalEventForm.propTypes = {
    model: PropTypes.object,
    errors: PropTypes.object,
    setModel: PropTypes.func,
    calendars: PropTypes.array,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number
};

export default MinimalEventForm;
