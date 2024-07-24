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
    { title: c('Label').t`1 minute`, value: 60 },
    { title: c('Label').t`2 minutes`, value: 120 },
    { title: c('Label').t`5 minutes`, value: 300 },
    { title: c('Label').t`10 minutes`, value: 600 },
    { title: c('Label').t`1 hour`, value: 3600 },
    { title: c('Label').t`4 hours`, value: 14400 },
];

export const LockTTLField: FC<Props> = ({ ttl, disabled, onChange, label }) => {
    /* Legacy values selectable prior to v1.20.1 */
    const legacyPlaceholder = (() => {
        switch (ttl) {
            case 30:
                return c('Label').t`30 seconds`;
            case 900:
                return c('Label').t`15 minutes`;
            case 1800:
                return c('Label').t`30 minutes`;
            default:
                return undefined;
        }
    })();

    return (
        <InputFieldTwo
            as={SelectTwo<number>}
            label={label}
            disabled={disabled}
            placeholder={legacyPlaceholder ?? c('Label').t`10 minutes`}
            onValue={onChange}
            value={ttl}
            dense
        >
            {getSessionLockTTLOptions().map(({ title, value }) => (
                <Option key={value} title={title} value={value} />
            ))}
        </InputFieldTwo>
    );
};
