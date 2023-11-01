import { type VFC, useState } from 'react';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { sessionUnlockIntent } from '@proton/pass/store/actions';
import { sessionUnlockRequest } from '@proton/pass/store/actions/requests';

export const Unlock: VFC = () => {
    const [value, setValue] = useState('');

    const [disabled, setDisabled] = useState(false);

    const unlock = useActionRequest({
        action: sessionUnlockIntent,
        requestId: sessionUnlockRequest(),
        onStart: () => setDisabled(true),
        onFailure: () => setDisabled(false),
    });

    useSessionLockPinSubmitEffect(value, { onSubmit: (pin) => unlock.dispatch({ pin }) });

    return <PinCodeInput loading={disabled} value={value} onValue={setValue} />;
};
