import { type FC, type ReactNode } from 'react';

import { c } from 'ttag';

import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';

type Props = {
    ttl?: number;
    disabled?: boolean;
    onChange: (ttl: number) => void;
    label?: ReactNode;
};

const getSessionLockTTLOptions = () => [
    { title: c('Label').t`30 seconds`, value: 30 },
    { title: c('Label').t`1 minute`, value: 60 },
    { title: c('Label').t`5 minutes`, value: 300 },
    { title: c('Label').t`10 minutes`, value: 600 },
    { title: c('Label').t`15 minutes`, value: 900 },
    { title: c('Label').t`30 minutes`, value: 1800 },
    { title: c('Label').t`1 hour`, value: 3600 },
];

export const LockTTLField: FC<Props> = ({ ttl, disabled, onChange, label }) => (
    <InputFieldTwo
        as={SelectTwo<number>}
        label={label}
        disabled={disabled}
        placeholder={c('Label').t`15 minutes`}
        onValue={onChange}
        value={ttl}
        dense
    >
        {getSessionLockTTLOptions().map(({ title, value }) => (
            <Option key={value} title={title} value={value} />
        ))}
    </InputFieldTwo>
);
