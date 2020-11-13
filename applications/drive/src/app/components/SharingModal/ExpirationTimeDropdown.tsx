import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import { EXPIRATION_DAYS } from '../../constants';

interface Props {
    value: number;
    onChange: (days: EXPIRATION_DAYS) => void;
    disabled?: boolean;
}

const ExpirationTimeDropdown = ({ value, onChange, disabled = false }: Props) => {
    const options = [
        { text: c('Label').t`1 day`, value: EXPIRATION_DAYS.ONE },
        { text: c('Label').t`15 days`, value: EXPIRATION_DAYS.FIFTEEN },
        { text: c('Label').t`30 days`, value: EXPIRATION_DAYS.THIRTY },
        { text: c('Label').t`60 days`, value: EXPIRATION_DAYS.SIXTY },
        { text: c('Label').t`90 days`, value: EXPIRATION_DAYS.NINETY },
    ];
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) =>
        onChange(parseInt(target.value, 10) as EXPIRATION_DAYS);
    return (
        <Select
            id="expiration-time-dropdown"
            value={value}
            options={options}
            disabled={disabled}
            onChange={handleChange}
        />
    );
};

export default ExpirationTimeDropdown;
