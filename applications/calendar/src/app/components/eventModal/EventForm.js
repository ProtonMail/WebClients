import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Label, Input, Select, Checkbox, LinkButton, TextArea } from 'react-components';

import Notifications from './Notifications';
import TimezoneSelector from '../TimezoneSelector';
import FrequencyInput from './FrequencyInput';
import CalendarIcon from '../calendar/CalendarIcon';
import TimeEventRow from './TimeEventRow';

const EventForm = ({ displayWeekNumbers, weekStartsOn, calendars = [], model, errors, setModel }) => {
    const calendarOptions = calendars.map(({ ID, Name }) => ({ text: Name, value: ID }));
    return (
        <>
            <TimeEventRow
                model={model}
                setModel={setModel}
                errors={errors}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
            />
            <Row>
                <Label> </Label>
                <div className="flex-item-fluid">
                    <div className="flex flex-spacebetween flex-nowrap flex-items-center">
                        <label htmlFor="event-allday-checkbox" className="inline-flex flex-items-center">
                            <Checkbox
                                id="event-allday-checkbox"
                                checked={model.isAllDay}
                                onChange={({ target }) => setModel({ ...model, isAllDay: target.checked })}
                            />
                            {c('Label').t`All day event`}
                        </label>
                        <LinkButton onClick={() => setModel({ ...model, hasMoreOptions: !model.hasMoreOptions })}>
                            {model.hasMoreOptions ? c('Action').t`Less options` : c('Action').t`More options`}
                        </LinkButton>
                    </div>
                </div>
            </Row>
            {model.hasMoreOptions ? (
                <>
                    <Row>
                        <Label>{c('Label').t`Frequency`}</Label>
                        <div className="flex flex-nowrap flex-item-fluid">
                            <FrequencyInput
                                value={model.frequency}
                                onChange={(frequency) => setModel({ ...model, frequency })}
                            />
                        </div>
                    </Row>
                    {!model.isAllDay ? (
                        <>
                            <Row>
                                <Label>{c('Label').t`Start timezone`}</Label>
                                <div className="flex flex-nowrap flex-item-fluid">
                                    <TimezoneSelector
                                        timezone={model.start.tzid}
                                        onChange={(tzid) => setModel({ ...model, start: { ...model.start, tzid } })}
                                        defaultTimezone={model.defaultTzid}
                                    />
                                </div>
                            </Row>
                            <Row>
                                <Label>{c('Label').t`End timezone`}</Label>
                                <div className="flex flex-nowrap flex-item-fluid">
                                    <TimezoneSelector
                                        timezone={model.end.tzid}
                                        onChange={(tzid) => setModel({ ...model, end: { ...model.end, tzid } })}
                                        defaultTimezone={model.defaultTzid}
                                    />
                                </div>
                            </Row>
                        </>
                    ) : null}
                </>
            ) : null}
            {calendarOptions.length && (
                <Row>
                    <Label htmlFor="event-calendar-select">{c('Label').t`Calendar`}</Label>
                    <div className="flex flex-nowrap flex-item-fluid flex-items-center">
                        <CalendarIcon className="mr1" color={model.color} />
                        <Select
                            id="event-calendar-select"
                            options={calendarOptions}
                            value={model.calendarID}
                            onChange={({ target }) => setModel({ ...model, calendarID: target.value })}
                        />
                    </div>
                </Row>
            )}
            <Row>
                <Label htmlFor="event-location-input">{c('Label').t`Location`}</Label>
                <div className="flex-item-fluid">
                    <Input
                        id="event-location-input"
                        placeholder={c('Placeholder').t`Add a location`}
                        value={model.location}
                        onChange={({ target }) => setModel({ ...model, location: target.value })}
                    />
                </div>
            </Row>
            <Row>
                <Label htmlFor="event-description-input">{c('Label').t`Description`}</Label>
                <div className="flex-item-fluid">
                    <TextArea
                        id="event-description-input"
                        autoGrow={true}
                        placeholder={c('Placeholder').t`Add a description`}
                        value={model.description}
                        onChange={({ target }) => setModel({ ...model, description: target.value })}
                    />
                </div>
            </Row>
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
