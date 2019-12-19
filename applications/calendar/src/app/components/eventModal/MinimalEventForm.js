import React from 'react';
import PropTypes from 'prop-types';
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
import RepeatIcon from '../../../assets/RepeatIcon';

const MinimalEventForm = ({ isSubmitted, isNarrow, displayWeekNumbers, weekStartsOn, errors, model, setModel }) => {
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
            collapseOnMobile={false}
            label={
                <>
                    <RepeatIcon />
                    <span className="sr-only">{c('Label').t`Frequency`}</span>
                </>
            }
            value={model.frequency}
            onChange={(frequency) => setModel({ ...model, frequency })}
        />
    );

    const calendarRow = model.calendars.length ? (
        <CalendarSelectRow
            collapseOnMobile={false}
            label={
                <>
                    <Icon name="calendar" style={{ fill: model.calendar.color }} />
                    <span className="sr-only">{c('Label').t`Calendar`}</span>
                </>
            }
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
                label={
                    <>
                        <Icon name="circle" style={{ fill: model.calendar.color }} />
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

MinimalEventForm.propTypes = {
    model: PropTypes.object,
    errors: PropTypes.object,
    setModel: PropTypes.func,
    calendars: PropTypes.array,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number
};

export default MinimalEventForm;
