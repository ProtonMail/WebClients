import { type FC, useEffect, useState } from 'react';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { sessionUnlockIntent } from '@proton/pass/store/actions';
import { sessionUnlockRequest } from '@proton/pass/store/actions/requests';

type Props = {
    onLoading?: (loading: boolean) => void;
};

export const PinUnlock: FC<Props> = ({ onLoading }) => {
    const [value, setValue] = useState('');

    /* Re-render the PIN input with correct input focus */
    const [key, rerender] = useRerender('pin-input');

    const unlock = useActionRequest(sessionUnlockIntent, {
        initialRequestId: sessionUnlockRequest(),
        onFailure: () => {
            setValue('');
            rerender();
        },
    });

    useEffect(() => onLoading?.(unlock.loading), [unlock.loading]);
    useSessionLockPinSubmitEffect(value, { onSubmit: (pin) => unlock.dispatch({ pin }) });

    return <PinCodeInput key={key} loading={unlock.loading} value={value} onValue={setValue} />;
};
