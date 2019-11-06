import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Label, Field, Select, Checkbox, DateInput, TimeInput } from 'react-components';

const AlarmForm = ({ displayWeekNumbers, weekStartsOn, model, setModel }) => {
    const frequencies = [
        { text: c('Option').t`One time`, value: '' },
        { text: c('Option').t`Every week`, value: '' },
        { text: c('Option').t`Every month`, value: '' },
        { text: c('Option').t`Every year`, value: '' }
    ];

    return (
        <>
            <Row>
                <Label>{c('Label').t`Date and time`}</Label>
                <Field className="flex flex-spacebetween flex-nowrap">
                    <DateInput
                        className="mr0-5"
                        required
                        value={model.start.date}
                        onChange={(newDate) => setModel({ ...model, start: { ...model.start, date: newDate } })}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                    />
                    {!model.isAllDay ? (
                        <TimeInput
                            value={model.end.time}
                            onChange={(newTime) => setModel({ ...model, start: { ...model.start, time: newTime } })}
                        />
                    ) : null}
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Frequency`}</Label>
                <Field>
                    <Select
                        value={model.frequency}
                        options={frequencies}
                        onChange={({ target }) => setModel({ ...model, frequency: target.value })}
                    />
                </Field>
                <label htmlFor="event-allday-checkbox" className="ml1 pt0-5">
                    <Checkbox
                        id="event-allday-checkbox"
                        checked={model.isAllDay}
                        onChange={({ target }) => setModel({ ...model, isAllDay: target.checked })}
                    />
                    {c('Label').t`All day`}
                </label>
            </Row>
        </>
    );
};

AlarmForm.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default AlarmForm;
