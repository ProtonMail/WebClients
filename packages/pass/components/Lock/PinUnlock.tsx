import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { useLockAutoSubmit } from '../../hooks/auth/useLockAutoSubmit';
import { useUnlockGuard } from '../../hooks/auth/useUnlockGuard';
import { useRequest } from '../../hooks/useRequest';
import { useRerender } from '../../hooks/useRerender';
import { LockMode } from '../../lib/auth/lock/types';
import { unlock } from '../../store/actions';
import { useOffline } from '../Core/ConnectivityProvider';
import { PinCodeInput } from './PinCodeInput';

type Props = {
    offlineEnabled?: boolean;
    onLoading?: (loading: boolean) => void;
    onOffline?: () => void;
};

export const PinUnlock: FC<Props> = ({ offlineEnabled, onLoading, onOffline }) => {
    const offline = useOffline();
    const [value, setValue] = useState('');
    const [key, rerender] = useRerender('pin-input'); /* Re-render the PIN input with correct input focus */

    const sessionUnlock = useRequest(unlock, {
        initial: true,
        onFailure: () => {
            setValue('');
            rerender();
        },
    });

    const onSubmit = (pin: string) => sessionUnlock.dispatch({ mode: LockMode.SESSION, pin, offline: false });

    useUnlockGuard({ offlineEnabled, onOffline: () => setValue('') });
    useLockAutoSubmit(value, { onSubmit });
    useEffect(() => onLoading?.(sessionUnlock.loading), [sessionUnlock.loading]);

    return (
        <div>
            <PinCodeInput
                key={key}
                className="mb-5"
                disabled={offline}
                autoFocus={!offline}
                loading={sessionUnlock.loading}
                onValue={setValue}
                value={value}
            />

            {offline && offlineEnabled && !sessionUnlock.loading && (
                <Button pill shape="ghost" color="norm" className="w-full mt-3" onClick={onOffline}>
                    {c('Action').t`Unlock offline with password`}
                </Button>
            )}

            {sessionUnlock.loading && <CircleLoader size="small" className="mt-4" />}
        </div>
    );
};
