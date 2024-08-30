import { type FC, type ReactNode } from 'react';

import { c } from 'ttag';

import { InputFieldTwo, Option, SelectTwo } from '@proton/components';

type Props = {
    ttl?: number;
    disabled?: boolean;
    onChange: (ttl: number) => void;
    label?: ReactNode;
};

export const TTL_LABELS: Partial<Record<number, () => string>> = {
    30: () => c('Label').t`30 seconds`,
    60: () => c('Label').t`1 minute`,
    120: () => c('Label').t`2 minutes`,
    300: () => c('Label').t`5 minutes`,
    600: () => c('Label').t`10 minutes`,
    900: () => c('Label').t`15 minutes`,
    1_800: () => c('Label').t`30 minutes`,
    3_600: () => c('Label').t`1 hour`,
};

export const TTL_OPTIONS: number[] = [60, 120, 300, 600, 3_600];

export const LockTTLField: FC<Props> = ({ ttl, disabled, onChange, label }) => (
    <InputFieldTwo
        as={SelectTwo<number>}
        label={label}
        disabled={disabled}
        placeholder={TTL_LABELS[ttl ?? 600]?.()}
        onValue={onChange}
        value={ttl}
        dense
    >
        {TTL_OPTIONS.map((value) => (
            <Option key={value} title={TTL_LABELS[value]?.() ?? ''} value={value} />
        ))}
    </InputFieldTwo>
);
