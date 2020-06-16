import React from 'react';
import { c } from 'ttag';
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
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { WeekStartsOn } from '../../containers/calendar/interface';
import { MAX_NOTIFICATIONS } from '../../constants';

interface Props {
    isSubmitted: boolean;
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const EventForm = ({ isSubmitted, isNarrow, displayWeekNumbers, weekStartsOn, errors, model, setModel }: Props) => {
    const allDayRow = (
        <Row collapseOnMobile>
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

    const frequencyRow = (
        <FrequencyRow
            label={c('Label').t`Frequency`}
            frequencyModel={model.frequencyModel}
            start={model.start}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            errors={errors}
            isSubmitted={isSubmitted}
            onChange={(frequencyModel) => setModel({ ...model, frequencyModel })}
        />
    );

    const timezoneRows = !model.isAllDay ? (
        <TimezoneRow
            startLabel={c('Label').t`Start timezone`}
            endLabel={c('Label').t`End timezone`}
            model={model}
            setModel={setModel}
        />
    ) : null;

    const calendarRow = model.calendars.length ? (
        <CalendarSelectRow label={c('Label').t`Calendar`} model={model} setModel={setModel} />
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
            {timezoneRows}
            {frequencyRow}
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
                            errors={errors}
                            canAdd={model.fullDayNotifications.length < MAX_NOTIFICATIONS}
                            notifications={model.fullDayNotifications}
                            defaultNotification={model.defaultFullDayNotification}
                            onChange={(notifications) => {
                                setModel({
                                    ...model,
                                    fullDayNotifications: notifications,
                                    hasModifiedNotifications: {
                                        ...model.hasModifiedNotifications,
                                        fullDay: true,
                                    },
                                });
                            }}
                        />
                    ) : (
                        <Notifications
                            errors={errors}
                            canAdd={model.partDayNotifications.length < MAX_NOTIFICATIONS}
                            notifications={model.partDayNotifications}
                            defaultNotification={model.defaultPartDayNotification}
                            onChange={(notifications) => {
                                setModel({
                                    ...model,
                                    partDayNotifications: notifications,
                                    hasModifiedNotifications: {
                                        ...model.hasModifiedNotifications,
                                        partDay: true,
                                    },
                                });
                            }}
                        />
                    )}
                </div>
            </Row>
        </>
    );
};

export default EventForm;
