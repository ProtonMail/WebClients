import React from 'react';
import PropTypes from 'prop-types';
import { Input, Label, Row } from 'react-components';
import { c } from 'ttag';

import EventForm from './EventForm';
import AlarmForm from './AlarmForm';
import TaskForm from './TaskForm';

const MainForm = ({ displayWeekNumbers, weekStartsOn, model, errors, setModel, calendars }) => {
    const PLACEHOLDER_TITLE = {
        event: c('Placeholder').t`Add an event title`,
        alarm: c('Placeholder').t`Add an alarm title`,
        task: c('Placeholder').t`Add a task title`
    };
    return (
        <>
            <Row>
                <Label htmlFor="event-title-input">{c('Label').t`Title`}</Label>
                <div className="flex-item-fluid">
                    <Input
                        id="event-title-input"
                        placeholder={PLACEHOLDER_TITLE[model.type]}
                        required
                        error={errors.title}
                        value={model.title}
                        onChange={({ target }) => setModel({ ...model, title: target.value })}
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
            {
                {
                    event: (
                        <EventForm
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            calendars={calendars}
                            errors={errors}
                            model={model}
                            setModel={setModel}
                        />
                    ),
                    alarm: (
                        <AlarmForm
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            model={model}
                            setModel={setModel}
                        />
                    ),
                    task: (
                        <TaskForm
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            model={model}
                            setModel={setModel}
                        />
                    )
                }[model.type]
            }
        </>
    );
};

MainForm.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default MainForm;
