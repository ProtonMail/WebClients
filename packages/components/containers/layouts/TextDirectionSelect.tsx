import * as React from 'react';
import { c } from 'ttag';

import { RIGHT_TO_LEFT } from '@proton/shared/lib/constants';

import { Select } from '../../components';

const { ON, OFF } = RIGHT_TO_LEFT;

interface Props {
    id: string;
    rightToLeft: RIGHT_TO_LEFT;
    onChange: (value: RIGHT_TO_LEFT) => void;
    loading: boolean;
}

const TextDirectionSelect = ({ id, rightToLeft, onChange, loading, ...rest }: Props) => {
    const options = [
        { text: c('Option').t`Left to Right`, value: OFF },
        { text: c('Option').t`Right to Left`, value: ON },
    ];

    const handleChange = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(parseInt(target.value, 10) as RIGHT_TO_LEFT);
    };

    return (
        <Select id={id} value={rightToLeft} options={options} disabled={loading} onChange={handleChange} {...rest} />
    );
};

export default TextDirectionSelect;
