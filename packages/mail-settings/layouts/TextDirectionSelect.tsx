import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

const { LEFT_TO_RIGHT, RIGHT_TO_LEFT } = DIRECTION;

interface Props {
    id: string;
    rightToLeft: DIRECTION;
    onChange: (value: DIRECTION) => void;
    loading: boolean;
}

const TextDirectionSelect = ({ id, rightToLeft, onChange, loading, ...rest }: Props) => {
    const options = [
        { text: c('Option').t`Left to Right`, value: LEFT_TO_RIGHT },
        { text: c('Option').t`Right to Left`, value: RIGHT_TO_LEFT },
    ];

    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => {
        onChange(parseInt(target.value, 10) as DIRECTION);
    };

    return (
        <Select id={id} value={rightToLeft} options={options} disabled={loading} onChange={handleChange} {...rest} />
    );
};

export default TextDirectionSelect;
