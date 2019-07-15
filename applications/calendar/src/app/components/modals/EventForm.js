import React from 'react';
import moment from 'moment';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Row,
    Label,
    Field,
    Input,
    DateInput,
    TimeSelect,
    Select,
    Checkbox,
    LinkButton,
    TextArea
} from 'react-components';

import Notifications from './Notifications';

const EventForm = ({ model, updateModel }) => {
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
                <Label htmlFor="startDate">{c('Label').t`Start`}</Label>
                <Field className="flex flex-spacebetween flex-nowrap">
                    <DateInput
                        id="startDate"
                        className="mr1"
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
                </Field>
                <div className="ml1">
                    {model.showTimezone ? null : (
                        <LinkButton onClick={() => updateModel({ ...model, showTimezone: true })}>{c('Action')
                            .t`Edit timezone`}</LinkButton>
                    )}
                    {model.showTimezone ? (
                        <Select
                            value={model.startTimezone}
                            onChange={({ target }) => updateModel({ ...model, startTimezone: target.value })}
                            options={timezones}
                        />
                    ) : null}
                </div>
            </Row>
            <Row>
                <Label htmlFor="endDate">{c('Label').t`End`}</Label>
                <Field className="flex flex-spacebetween flex-nowrap">
                    <DateInput
                        id="endDate"
                        className="mr1"
                        defaultDate={new Date()}
                        setDefaultDate
                        onSelect={(date) => updateModel({ ...model, endDate: new Date(date).getTime() })}
                        format={moment.localeData().longDateFormat('L')}
                    />
                    {model.allDay ? null : (
                        <TimeSelect value={model.endTime} onChange={(endTime) => updateModel({ ...model, endTime })} />
                    )}
                </Field>
                <div className="ml1">
                    {model.showTimezone ? (
                        <Select
                            value={model.endTimezone}
                            onChange={({ target }) => updateModel({ ...model, endTimezone: target.value })}
                            options={timezones}
                        />
                    ) : null}
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Frequency`}</Label>
                <Field>
                    <Select
                        value={model.frequency}
                        options={frequencies}
                        onChange={({ target }) => updateModel({ ...model, frequency: target.value })}
                    />
                </Field>
                <label htmlFor="event-allday-checkbox" className="ml1 pt0-5">
                    <Checkbox
                        id="event-allday-checkbox"
                        checked={model.allDay}
                        onChange={({ target }) => updateModel({ ...model, allDay: target.checked })}
                    />
                    {c('Label').t`All day`}
                </label>
            </Row>
            <Row>
                <Label htmlFor="event-location-input">{c('Label').t`Location`}</Label>
                <Field>
                    <Input
                        id="event-location-input"
                        placeholder={c('Placeholder').t`Add a location`}
                        value={model.location}
                        onChange={({ target }) => updateModel({ ...model, location: target.value })}
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Notifications`}</Label>
                <div>
                    <Notifications model={model} updateModel={updateModel} />
                </div>
            </Row>
            <Row>
                <Label htmlFor="event-description-input">{c('Label').t`Description`}</Label>
                <Field>
                    <TextArea
                        id="event-description-input"
                        placeholder={c('Placeholder').t`Add a description`}
                        value={model.description}
                        onChange={({ target }) => updateModel({ ...model, description: target.value })}
                    />
                </Field>
            </Row>
        </>
    );
};

EventForm.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default EventForm;
