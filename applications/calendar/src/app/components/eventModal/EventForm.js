import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Label } from 'react-components';

import Notifications from './Notifications';
import AllDayCheckbox from './inputs/AllDayCheckbox';
import CalendarSelectRow from './rows/CalendarSelectRow';
import LocationRow from './rows/LocationRow';
import DescriptionRow from './rows/DescriptionRow';
import FrequencyRow from './rows/FrequencyRow';
import TimezoneRow from './rows/TimezoneRow';
import DateTimeRow from './rows/DateTimeRow';
import TitleRow from './rows/TitleRow';
import { getAllDayCheck } from './eventForm/stateActions';

const EventForm = ({ isSubmitted, isNarrow, displayWeekNumbers, weekStartsOn, errors, model, setModel }) => {
    const allDayRow = (
        <Row>
            <span className={'pm-label'}></span>
            <div className="flex-item-fluid">
                <AllDayCheckbox
                    className="mb1"
                    checked={model.isAllDay}
                    onChange={(isAllDay) => setModel({ ...model, ...getAllDayCheck(model, isAllDay) })}
                />
            </div>
        </Row>
    );

    const frequencyRow = (
        <FrequencyRow
            label={c('Label').t`Frequency`}
            value={model.frequency}
            onChange={(frequency) => setModel({ ...model, frequency })}
        />
    );

    const timezoneRows = !model.isAllDay ? (
        <TimezoneRow
            startLabel={c('Label').t`Start timezone`}
            endLabel={c('Label').t`End timezone`}
            start={model.start}
            end={model.end}
            onChangeStart={(start) => setModel({ ...model, start })}
            onChangeEnd={(end) => setModel({ ...model, end })}
        />
    ) : null;

    const calendarRow = model.calendars.length ? (
        <CalendarSelectRow
            label={c('Label').t`Calendar`}
            options={model.calendars}
            value={model.calendar}
            onChange={({ id, color }) => setModel({ ...model, calendar: { id, color } })}
        />
    ) : null;

    return (
        <>
            <TitleRow
                label={c('Label').t`Title`}
                type={model.type}
                value={model.title}
                error={errors.title}
                onChange={(value) => setModel({ ...model, title: value })}
                isSubmitted={isSubmitted}
            />
            {allDayRow}
            <DateTimeRow
                label={c('Label').t`Time`}
                model={model}
                setModel={setModel}
                endError={errors.end}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isNarrow={isNarrow}
            />
            {frequencyRow}
            {timezoneRows}
            {calendarRow}
            <LocationRow
                label={c('Label').t`Location`}
                value={model.location}
                onChange={(location) => setModel({ ...model, location })}
            />
            <DescriptionRow
                label={c('Label').t`Description`}
                value={model.description}
                onChange={(description) => setModel({ ...model, description })}
            />
            <Row>
                <Label>{c('Label').t`Notifications`}</Label>
                <div className="flex-item-fluid">
                    {model.isAllDay ? (
                        <Notifications
                            notifications={model.fullDayNotifications}
                            defaultNotification={model.defaultFullDayNotification}
                            onChange={(notifications) => {
                                setModel({ ...model, fullDayNotifications: notifications });
                            }}
                        />
                    ) : (
                        <Notifications
                            notifications={model.partDayNotifications}
                            defaultNotification={model.defaultPartDayNotification}
                            onChange={(notifications) => {
                                setModel({ ...model, partDayNotifications: notifications });
                            }}
                        />
                    )}
                </div>
            </Row>
        </>
    );
};

EventForm.propTypes = {
    model: PropTypes.object,
    errors: PropTypes.object,
    setModel: PropTypes.func,
    calendars: PropTypes.array,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number
};

export default EventForm;
