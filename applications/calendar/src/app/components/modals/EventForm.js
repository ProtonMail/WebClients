import React from 'react';
import moment from 'moment';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Row,
    Label,
    Input,
    DateInput,
    TimeSelect,
    Select,
    Checkbox,
    LinkButton,
    ColorPicker,
    TextArea
} from 'react-components';

import AttendeeRow from './AttendeeRow';
import NotificationRow from './NotificationRow';

const EventForm = ({ calendars = [], model, updateModel }) => {
    const calendarOptions = calendars.map(({ ID, Name }) => ({ text: Name, value: ID }));
    const timezones = [];
    const frequencies = [
        { text: c('Option').t`One time`, value: '' },
        { text: c('Option').t`Every week`, value: '' },
        { text: c('Option').t`Every month`, value: '' },
        { text: c('Option').t`Every year`, value: '' }
    ];

    return (
        <>
            <Row>
                <Label htmlFor="startDate">{c('Label').t`Time`}</Label>
                <div className="flex-item-fluid">
                    <div className="flex flex-spacebetween flex-nowrap flex-items-center mb1">
                        <div className="flex flex-nowrap">
                            <DateInput
                                className="mr0-5"
                                required
                                defaultDate={new Date()}
                                setDefaultDate
                                onSelect={(date) => updateModel({ ...model, startDate: new Date(date).getTime() })}
                                format={moment.localeData().longDateFormat('L')}
                            />
                            {model.allDay ? null : (
                                <TimeSelect
                                    value={model.startTime}
                                    onChange={(startTime) => updateModel({ ...model, startTime })}
                                />
                            )}
                        </div>
                        <div className="pl0-5 pr0-5">-</div>
                        <div className="flex flex-nowrap">
                            <DateInput
                                required
                                className="mr0-5"
                                defaultDate={new Date()}
                                setDefaultDate
                                onSelect={(date) => updateModel({ ...model, endDate: new Date(date).getTime() })}
                                format={moment.localeData().longDateFormat('L')}
                            />
                            {model.allDay ? null : (
                                <TimeSelect
                                    value={model.endTime}
                                    onChange={(endTime) => updateModel({ ...model, endTime })}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-spacebetween flex-nowrap flex-items-center">
                        <label htmlFor="event-allday-checkbox" className="pt0-5">
                            <Checkbox
                                id="event-allday-checkbox"
                                checked={model.allDay}
                                onChange={({ target }) => updateModel({ ...model, allDay: target.checked })}
                            />
                            {c('Label').t`All day event`}
                        </label>
                        {model.moreOptions ? null : (
                            <LinkButton onClick={() => updateModel({ ...model, moreOptions: true })}>{c('Action')
                                .t`More options`}</LinkButton>
                        )}
                    </div>
                </div>
            </Row>
            {model.moreOptions ? (
                <Row>
                    <Label>{c('Label').t`Repetition`}</Label>
                    <div>
                        <Select
                            value={model.frequency}
                            options={frequencies}
                            onChange={({ target }) => updateModel({ ...model, frequency: target.value })}
                        />
                    </div>
                </Row>
            ) : null}
            {model.moreOptions ? (
                <Row>
                    <Label>{c('Label').t`Timezone`}</Label>
                    <div>
                        <Select
                            value={model.timezone}
                            onChange={({ target }) => updateModel({ ...model, startTimezone: target.value })}
                            options={timezones}
                        />
                    </div>
                </Row>
            ) : null}
            <Row>
                <Label htmlFor="event-calendar-select">{c('Label').t`Calendar`}</Label>
                <div className="flex flex-nowrap flex-item-fluid">
                    <Select
                        id="event-calendar-select"
                        className="mr1"
                        options={calendarOptions}
                        value={model.calendar}
                        onChange={({ target }) => updateModel({ ...model, calendar: target.value })}
                    />
                    <ColorPicker color={model.color} onChange={({ hex: color }) => updateModel({ ...model, color })}>
                        &nbsp;
                    </ColorPicker>
                </div>
            </Row>
            <Row>
                <Label htmlFor="event-location-input">{c('Label').t`Location`}</Label>
                <div className="flex-item-fluid">
                    <Input
                        id="event-location-input"
                        placeholder={c('Placeholder').t`Add a location`}
                        value={model.location}
                        onChange={({ target }) => updateModel({ ...model, location: target.value })}
                    />
                </div>
            </Row>
            <Row>
                <Label htmlFor="event-description-input">{c('Label').t`Description`}</Label>
                <div className="flex-item-fluid">
                    <TextArea
                        id="event-description-input"
                        placeholder={c('Placeholder').t`Add a description`}
                        value={model.description}
                        onChange={({ target }) => updateModel({ ...model, description: target.value })}
                    />
                </div>
            </Row>
            <AttendeeRow model={model} updateModel={updateModel} />
            <NotificationRow model={model} updateModel={updateModel} />
        </>
    );
};

EventForm.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func,
    calendars: PropTypes.array
};

export default EventForm;
