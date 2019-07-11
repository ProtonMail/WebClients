import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import moment from 'moment';
import { Row, Label, Field, DateInput, TimeSelect, Select, Checkbox } from 'react-components';

const AlarmForm = ({ model, updateModel }) => {
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
                        id="date"
                        className="mr1"
                        defaultDate={new Date()}
                        setDefaultDate
                        onSelect={(date) => updateModel({ ...model, date: new Date(date).getTime() })}
                        format={moment.localeData().longDateFormat('L')}
                    />
                    {model.allDay ? null : (
                        <TimeSelect value={model.time} onChange={(time) => updateModel({ ...model, time })} />
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
        </>
    );
};

AlarmForm.propTypes = {
    model: PropTypes.object,
    updateModel: PropTypes.func
};

export default AlarmForm;
