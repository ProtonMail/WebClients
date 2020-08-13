import React from 'react';
import { c } from 'ttag';
import { Input } from '../../components';

interface Props {
    value: string;
    setValue: (danger: string) => void;
    dangerWord: string;
    id: string;
}
const ResetDangerInput = ({ id, value, setValue, dangerWord }: Props) => {
    return (
        <Input
            id={id}
            placeholder={c('Placeholder').t`Enter the word '${dangerWord}' here`}
            value={value}
            onChange={({ target }) => setValue(target.value)}
            error={value.length > 0 && value !== dangerWord ? c('Error').t`Please enter '${dangerWord}'` : ''}
            required
        />
    );
};

export default ResetDangerInput;
