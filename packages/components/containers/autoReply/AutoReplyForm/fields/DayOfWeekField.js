import React, { useMemo } from 'react';
import { Row, Label, Field, Select } from 'react-components';
import PropTypes from 'prop-types';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';

const DayOfWeekField = ({ id, label, value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    const options = useMemo(() => {
        return getFormattedWeekdays('iiii', { locale: dateLocale }).map((day, index) => ({ text: day, value: index }));
    }, [dateLocale]);

    return (
        <Row>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <Select id={id} options={options} onChange={handleChange} value={value} />
            </Field>
        </Row>
    );
};

DayOfWeekField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default DayOfWeekField;
