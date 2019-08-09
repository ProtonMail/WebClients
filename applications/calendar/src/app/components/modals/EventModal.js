import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
    FormModal,
    Row,
    Label,
    Input,
    // Group,
    // ButtonGroup,
    useNotifications,
    useCalendars
} from 'react-components';
import { c } from 'ttag';

import EventForm from './EventForm';
import AlarmForm from './AlarmForm';
import TaskForm from './TaskForm';

const getModel = ({ start = new Date(), end = new Date(), allDay = false, type = 'event' }) => {
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
        attendees: [],
        description: '',
        allDay,
        startDate,
        endDate,
        startTime,
        endTime
    };
};

const EventModal = ({ eventID, start, end, allDay, type, ...rest }) => {
    const [calendars] = useCalendars();
    const i18n = {
        event: {
            create: c('Title').t`Create event`,
            update: c('Title').t`Update event`,
            updated: c('Success').t`Event updated`,
            deleted: c('Success').t`Event deleted`,
            delete: c('Tooltip').t`Delete event`
        },
        task: {
            create: c('Title').t`Create task`,
            update: c('Title').t`Update task`,
            updated: c('Success').t`Task updated`,
            deleted: c('Success').t`Task deleted`,
            delete: c('Tooltip').t`Delete task`
        },
        alarm: {
            create: c('Title').t`Create alarm`,
            update: c('Title').t`Update alarm`,
            updated: c('Success').t`Alarm updated`,
            deleted: c('Success').t`Alarm deleted`,
            delete: c('Tooltip').t`Delete alarm`
        }
    };
    const titleRef = useRef();
    const { createNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [events] = [[]]; // TODO useEvents();
    const event = events.find(({ ID }) => ID === eventID);
    const [model, updateModel] = useState(getModel({ event, start, end, allDay, type }));
    const title = i18n[model.type][eventID ? 'update' : 'create'];

    const handleSubmit = async () => {
        setLoading(true);
        // TODO prepare parameters to send to the API
        // TODO save API call
        setLoading(false);
        rest.onClose();
        createNotification({ text: i18n[model.type][eventID ? 'updated' : 'created'] });
    };

    // const handleDelete = async () => {
    //     setLoading(true);
    //     // TODO delete API call
    //     setLoading(false);
    //     rest.onClose();
    //     createNotification({ text: i18n[model.type].deleted });
    // };

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
                <div className="flex-item-fluid">
                    <Input
                        ref={titleRef}
                        id="event-title-input"
                        placeholder={c('Placeholder').t`Add a title`}
                        required
                        value={model.title}
                        onChange={({ target }) => updateModel({ ...model, title: target.value })}
                    />
                </div>
            </Row>
            {/* <Row>
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
            </Row> */}
            {model.type === 'event' ? (
                <EventForm calendars={calendars} model={model} updateModel={updateModel} />
            ) : null}
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
