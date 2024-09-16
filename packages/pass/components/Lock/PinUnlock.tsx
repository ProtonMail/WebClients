import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock } from '@proton/pass/store/actions';
import { unlockRequest } from '@proton/pass/store/actions/requests';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    offlineEnabled?: boolean;
    onLoading?: (loading: boolean) => void;
    onOffline?: () => void;
};

export const PinUnlock: FC<Props> = ({ offlineEnabled, onLoading, onOffline }) => {
    const online = useConnectivity();
    const { createNotification } = useNotifications();

    const [value, setValue] = useState('');
    const [key, rerender] = useRerender('pin-input'); /* Re-render the PIN input with correct input focus */

    const sessionUnlock = useRequest(unlock, {
        initialRequestId: unlockRequest(),
        onFailure: () => {
            setValue('');
            rerender();
        },
    });

    useEffect(() => onLoading?.(sessionUnlock.loading), [sessionUnlock.loading]);

    useEffect(() => {
        if (!online) {
            setValue('');

            if (offlineEnabled === false) {
                createNotification({
                    type: 'error',
                    text: c('Error')
                        .t`You're currently offline. Please resume connectivity in order to unlock ${PASS_SHORT_APP_NAME}.`,
                });
            }
        }
    }, [online, offlineEnabled]);

    useSessionLockPinSubmitEffect(value, {
        onSubmit: (secret) => sessionUnlock.dispatch({ mode: LockMode.SESSION, secret }),
    });

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
