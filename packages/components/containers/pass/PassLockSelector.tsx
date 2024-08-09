import { type FC } from 'react';

import { c } from 'ttag';

import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';
import { TTL_LABELS, TTL_OPTIONS } from '@proton/pass/components/Lock/LockTTLField';

type Props = {
    value?: number;
    disabled?: boolean;
    onChange: (value: number) => void;
};

const getOptions = () => [
    { title: c('Label').t`Disabled`, value: 0 },
    /* BE doesn't support values above 3600 */
    ...TTL_OPTIONS.filter((value) => value <= 3_600).map((value) => ({
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
