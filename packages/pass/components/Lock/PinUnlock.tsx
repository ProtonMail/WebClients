import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useLockAutoSubmit } from '@proton/pass/hooks/auth/useLockAutoSubmit';
import { useUnlockGuard } from '@proton/pass/hooks/auth/useUnlockGuard';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock } from '@proton/pass/store/actions';

type Props = {
    offlineEnabled?: boolean;
    onLoading?: (loading: boolean) => void;
    onOffline?: () => void;
};

export const PinUnlock: FC<Props> = ({ offlineEnabled, onLoading, onOffline }) => {
    const online = useOnline();
    const [value, setValue] = useState('');
    const [key, rerender] = useRerender('pin-input'); /* Re-render the PIN input with correct input focus */

    const sessionUnlock = useRequest(unlock, {
        initial: true,
        onFailure: () => {
            setValue('');
            rerender();
        },
    });

    const onSubmit = (secret: string) => sessionUnlock.dispatch({ mode: LockMode.SESSION, secret, offline: false });

    useUnlockGuard({ offlineEnabled, onOffline: () => setValue('') });
    useLockAutoSubmit(value, { onSubmit });
    useEffect(() => onLoading?.(sessionUnlock.loading), [sessionUnlock.loading]);

    return (
        <div>
            <PinCodeInput
                key={key}
                className="mb-5"
                disabled={!online}
                autoFocus={online}
                loading={sessionUnlock.loading}
                onValue={setValue}
                value={value}
            />

            {!online && offlineEnabled && !sessionUnlock.loading && (
                <Button pill shape="ghost" color="norm" className="w-full mt-3" onClick={onOffline}>
                    {c('Action').t`Unlock offline with password`}
                </Button>
            )}

            {sessionUnlock.loading && <CircleLoader size="small" className="mt-4" />}
        </div>
    );
};
