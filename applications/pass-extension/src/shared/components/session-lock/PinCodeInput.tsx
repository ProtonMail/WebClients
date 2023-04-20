import type { VFC } from 'react';

import { TotpInput } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './PinCodeInput.scss';

/* FIXME: support proper disabled prop on TotpInput */
export const PinCodeInput: VFC<{ value: string; onValue: (value: string) => void; loading?: boolean }> = ({
    value,
    onValue,
    loading = false,
}) => {
    return (
        <div className={clsx('pass-pin--input', loading && 'opacity-30 no-pointer-events')}>
            <TotpInput
                length={6}
                value={value}
                onValue={onValue}
                autoFocus
                inputType="password"
                disableChange={loading}
            />
        </div>
    );
};
