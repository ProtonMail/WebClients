import React from 'react';
import { Label, Checkbox, Row, Field } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';

const DaysOfWeekField = ({ value, onChange }) => {
    const handleChange = (weekday) => () =>
        onChange(value.includes(weekday) ? value.filter((existing) => weekday !== existing) : [...value, weekday]);

    return (
        <Row>
            <Label>{c('Label').t`Days of the week`}</Label>
            <Field>
                <div className="flex flex-column">
                    {getFormattedWeekdays('iiii', { locale: dateLocale }).map((text, i) => (
                        <Checkbox id={`weekday-${i}`} key={text} checked={value.includes(i)} onChange={handleChange(i)}>
                            {text}
                        </Checkbox>
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
