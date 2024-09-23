import { type FC } from 'react';

import { c } from 'ttag';

import { InputFieldTwo } from '@proton/components';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { TTL_LABELS, TTL_OPTIONS } from '@proton/pass/components/Lock/LockTTLField';

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
