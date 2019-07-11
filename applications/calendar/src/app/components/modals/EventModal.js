import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    FormModal,
    Row,
    Label,
    Field,
    Input,
    useApi,
    ErrorButton,
    Group,
    ButtonGroup,
    useNotifications
} from 'react-components';
import { c } from 'ttag';

import EventForm from './EventForm';
import AlarmForm from './AlarmForm';
import TaskForm from './TaskForm';

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

    const handleSubmit = async () => {
        setLoading(true);
        // TODO prepare parameters to send to the API
        // TODO save API call
        setLoading(false);
        rest.onClose();
        createNotification({ text: eventID ? c('Success').t`Event updated` : c('Success').t`Event created` });
    };

    const handleDelete = async () => {
        setLoading(true);
        // TODO delete API call
        setLoading(false);
        rest.onClose();
        createNotification({ text: c('Success').t`Event deleted` });
    };

    const decrypt = () => {
        // TODO decrypt event data to build the model
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
                {eventID ? (
                    <ErrorButton disabled={loading} onClick={handleDelete}>{c('Action').t`Delete`}</ErrorButton>
                ) : null}
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
                        <ButtonGroup
                            className={model.type === 'task' ? 'is-active' : ''}
                            onClick={() => updateModel({ ...model, type: 'task' })}
                        >{c('Event type').t`Task`}</ButtonGroup>
                    </Group>
                </Field>
            </Row>
            {model.type === 'event' ? <EventForm model={model} updateModel={updateModel} /> : null}
            {model.type === 'alarm' ? <AlarmForm model={model} updateModel={updateModel} /> : null}
            {model.type === 'task' ? <TaskForm model={model} updateModel={updateModel} /> : null}
        </FormModal>
    );
};

EventModal.propTypes = {
    eventID: PropTypes.string
};

export default EventModal;
