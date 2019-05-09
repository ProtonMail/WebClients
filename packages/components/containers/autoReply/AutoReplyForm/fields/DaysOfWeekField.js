import React from 'react';
import { Label, Checkbox, Row, Field } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getWeekdayOptions } from '../../utils';

const DaysOfWeekField = ({ value, onChange }) => {
    const handleChange = (weekday) => () =>
        onChange(value.includes(weekday) ? value.filter((existing) => weekday !== existing) : [...value, weekday]);

    return (
        <Row className="flex-spacebetween">
            <Label>{c('Label').t`Days of the week`}</Label>
            <Field>
                <div className="flex flex-column">
                    {getWeekdayOptions().map(({ text, value: weekday }) => (
                        <Label htmlFor={`weekday-${weekday}`} key={text}>
                            <Checkbox
                                id={`weekday-${weekday}`}
                                checked={value.includes(weekday)}
                                onChange={handleChange(weekday)}
                            />
                            {text}
                        </Label>
                    ))}
                </div>
            </Field>
        </Row>
    );
};

DaysOfWeekField.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default DaysOfWeekField;
