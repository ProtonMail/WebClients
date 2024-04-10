import { type FC, useEffect, useState } from 'react';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock } from '@proton/pass/store/actions';
import { unlockRequest } from '@proton/pass/store/actions/requests';

type Props = {
    onLoading?: (loading: boolean) => void;
};

export const PinUnlock: FC<Props> = ({ onLoading }) => {
    const [value, setValue] = useState('');

    /* Re-render the PIN input with correct input focus */
    const [key, rerender] = useRerender('pin-input');

    const sessionUnlock = useRequest(unlock, {
        initialRequestId: unlockRequest(),
        onFailure: () => {
            setValue('');
            rerender();
        },
    });

    useEffect(() => onLoading?.(sessionUnlock.loading), [sessionUnlock.loading]);

    useSessionLockPinSubmitEffect(value, {
        onSubmit: (secret) => sessionUnlock.dispatch({ mode: LockMode.SESSION, secret }),
    });

    return <PinCodeInput key={key} loading={sessionUnlock.loading} value={value} onValue={setValue} />;
};
