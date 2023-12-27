import { type FC, useState } from 'react';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { sessionUnlockIntent } from '@proton/pass/store/actions';
import { sessionUnlockRequest } from '@proton/pass/store/actions/requests';
import noop from '@proton/utils/noop';

type Props = {
    loading?: boolean;
    onFailure?: () => void;
    onStart?: () => void;
};

export const Unlock: FC<Props> = ({ loading, onFailure = noop, onStart = noop }) => {
    const [value, setValue] = useState('');

    const unlock = useActionRequest({
        action: sessionUnlockIntent,
        initialRequestId: sessionUnlockRequest(),
        onStart,
        onFailure,
    });

    useSessionLockPinSubmitEffect(value, { onSubmit: (pin) => unlock.dispatch({ pin }) });

    return <PinCodeInput loading={loading} value={value} onValue={setValue} />;
};
