import type { FC } from 'react';

import { c } from 'ttag';

import { TTL_LABELS, TTL_OPTIONS } from '@proton/pass/components/Lock/LockTTLField';

import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import InputFieldTwo from '../../components/v2/field/InputField';

type Props = {
    value?: number;
    disabled?: boolean;
    onChange: (value: number) => void;
};

const getOptions = () => [
    { title: c('Label').t`Disabled`, value: 0 },
    ...TTL_OPTIONS.map((value) => ({
        title: TTL_LABELS[value]?.() ?? '',
        value,
    })),
];

export const PassLockSelector: FC<Props> = ({ value, disabled, onChange }) => (
    <InputFieldTwo
        as={SelectTwo<number>}
        id="pass-lock-select"
        disabled={disabled}
        placeholder={c('Label').t`Disabled`}
        onValue={onChange}
        value={value}
        dense
    >
        {getOptions().map(({ title, value }) => (
            <Option key={value} title={title} value={value} />
        ))}
    </InputFieldTwo>
);
