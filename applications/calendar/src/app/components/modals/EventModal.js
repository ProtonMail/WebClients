import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
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
    useNotifications,
    ColorPicker
} from 'react-components';
import { c } from 'ttag';

import EventForm from './EventForm';
import AlarmForm from './AlarmForm';
import TaskForm from './TaskForm';
import InviteForm from './InviteForm';

const getModel = ({ event = {}, start = new Date(), end = new Date(), allDay = false, type = 'event' }) => {
    const startDate = moment
        .utc(start)
        .startOf('day')
        .valueOf();
    const endDate = moment
        .utc(end)
        .startOf('day')
        .valueOf();
    const startTime =
        moment
            .utc()
            .startOf('hour')
            .add(30 * Math.floor(moment().minutes() / 30), 'minutes')
            .valueOf() - startDate;
    const endTime =
        moment
            .utc()
            .startOf('hour')
            .add(30 * Math.floor(moment().minutes() / 30), 'minutes')
            .valueOf() - endDate;
    return {
        type,
        notifications: [],
        description: '',
        allDay,
        startDate,
        endDate,
        startTime,
        endTime
    };
};

const EventModal = ({ eventID, start, end, allDay, type, ...rest }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [events] = [[]]; // useEvents();
    const event = events.find(({ ID }) => ID === eventID);
    const [model, updateModel] = useState(getModel({ event, start, end, allDay, type }));
    const title = eventID ? c('Title').t`Update event` : c('Title').t`Create an event`;

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
                <div className="ml1">
                    <ColorPicker
                        className="mr1"
                        color={model.color}
                        onChange={({ hex: color }) => updateModel({ ...model, color })}
                    >
                        &nbsp;
                    </ColorPicker>
                    {eventID ? (
                        <ErrorButton title={c('Tooltip').t`Delete event`} disabled={loading} onClick={handleDelete}>{c(
                            'Action'
                        ).t`Delete`}</ErrorButton>
                    ) : null}
                </div>
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
            {model.type === 'event' ? <InviteForm model={model} updateModel={updateModel} /> : null}
            {model.type === 'alarm' ? <AlarmForm model={model} updateModel={updateModel} /> : null}
            {model.type === 'task' ? <TaskForm model={model} updateModel={updateModel} /> : null}
        </FormModal>
    );
};

EventModal.propTypes = {
    eventID: PropTypes.string,
    type: PropTypes.oneOf(['event', 'alarm', 'task']),
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
    allDay: PropTypes.bool
};

export default EventModal;
