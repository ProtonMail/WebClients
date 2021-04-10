import React, { useMemo } from 'react';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Row, Label, Field, Select } from '../../../../components';

interface Props {
    id: string;
    label: string;
    value?: number;
    onChange: (day: number) => void;
}

const DayOfWeekField = ({ id, label, value, onChange }: Props) => {
    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    const options = useMemo(() => {
        return getFormattedWeekdays('iiii', { locale: dateLocale }).map((day, index) => ({ text: day, value: index }));
    }, [dateLocale]);

    return (
        <Row>
            <Label htmlFor={id} className="text-semibold">
                {label}
            </Label>
            <Field>
                <Select id={id} options={options} onChange={handleChange} value={value} />
            </Field>
        </Row>
    );
};

export default DayOfWeekField;
