import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    FormModal,
    Row,
    Label,
    Field,
    Input,
    useApi,
    DateInput,
    TimeSelect,
    Select,
    Group,
    Checkbox,
    RichTextEditor,
    ButtonGroup,
    useNotifications
} from 'react-components';
import { c } from 'ttag';
import moment from 'moment';

const getDefaultModel = () => {
    return {
        type: 'event',
        description: '',
        allDay: false
    };
};

const EventModal = ({ eventID, ...rest }) => {
    const { createNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [model, updateModel] = useState(eventID ? {} : getDefaultModel());
    const api = useApi();
    const title = eventID ? c('Title').t`Update event` : c('Title').t`Create event`;
    const timezones = [];
    const frequencies = [
        { text: c('Option').t`One time`, value: '' },
        { text: c('Option').t`Every week`, value: '' },
        { text: c('Option').t`Every month`, value: '' },
        { text: c('Option').t`Every year`, value: '' }
    ];

    const handleSubmit = async () => {
        setLoading(true);
        // TODO save data
        setLoading(false);
        rest.onClose();
        createNotification({ text: eventID ? c('Success').t`Event updated` : c('Success').t`Event created` });
    };

    const decrypt = () => {
        // TODO decrypt event data
        // TODO update model
    };

    useEffect(() => {
        if (eventID) {
            decrypt();
        }
    }, []);

    return (
        <FormModal title={title} loading={loading} onSubmit={handleSubmit} submit={c('Action').t`Save`} {...rest}>
            <Row>
                <Label htmlFor="event-title-input">{c('Label').t`Title`}</Label>
                <Field>
                    <Input
                        id="event-title-input"
                        placeholder={c('Placeholder').t`Add a title`}
                        value={model.title}
                        onChange={({ target }) => updateModel({ ...model, title: target.value })}
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Type`}</Label>
                <Field>
                    <Group>
                        <ButtonGroup
                            className={model.type === 'event' ? 'is-active' : ''}
                            onClick={() => updateModel({ ...model, type: 'event' })}
                        >{c('Event type').t`Event`}</ButtonGroup>
                        <ButtonGroup
                            className={model.type === 'alarm' ? 'is-active' : ''}
                            onClick={() => updateModel({ ...model, type: 'alarm' })}
                        >{c('Event type').t`Alarm`}</ButtonGroup>
                    </Group>
                </Field>
            </Row>
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
        </FormModal>
    );
};

EventModal.propTypes = {
    eventID: PropTypes.string
};

export default EventModal;
