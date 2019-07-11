import React from 'react';
import moment from 'moment';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Label, Field, Input, DateInput, TimeSelect, Select, Checkbox, RichTextEditor } from 'react-components';

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
                <Label>{c('Label').t`Start`}</Label>
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
            </Row>
            <Row>
                <Label>{c('Label').t`End`}</Label>
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
            </Row>
            <Row>
                <Label>{c('Label').t`Frequency`}</Label>
                <Field className="flex flex-spacebetween flex-nowrap">
                    <div className="w50">
                        <Checkbox
                            id="event-allday-checkbox"
                            checked={model.allDay}
                            onChange={({ target }) => updateModel({ ...model, allDay: target.checked })}
                        />
                        <label htmlFor="event-allday-checkbox">{c('Label').t`All day`}</label>
                    </div>
                    <Select
                        value={model.frequency}
                        options={frequencies}
                        onChange={({ target }) => updateModel({ ...model, frequency: target.value })}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="event-timezone-select">{c('Label').t`Timezone`}</Label>
                <Field>
                    <Select
                        id="event-timezone-select"
                        value={model.timezone}
                        onChange={({ target }) => updateModel({ ...model, timezone: target.value })}
                        options={timezones}
                    />
                </Field>
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
                <Label htmlFor="event-description-input">{c('Label').t`Description`}</Label>
                <Field>
                    <RichTextEditor
                        id="event-description-input"
                        placeholder={c('Placeholder').t`Add a description`}
                        value={model.description}
                        onChange={(description) => updateModel({ ...model, description })}
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
