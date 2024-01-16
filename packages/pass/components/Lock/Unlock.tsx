import { type FC, useEffect, useState } from 'react';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { sessionUnlockIntent } from '@proton/pass/store/actions';
import { sessionUnlockRequest } from '@proton/pass/store/actions/requests';

type Props = {
    onLoading?: (loading: boolean) => void;
};

export const Unlock: FC<Props> = ({ onLoading }) => {
    const [value, setValue] = useState('');

    const unlock = useActionRequest({
        action: sessionUnlockIntent,
        initialRequestId: sessionUnlockRequest(),
    });

    useEffect(() => onLoading?.(unlock.loading), [unlock.loading]);
    useSessionLockPinSubmitEffect(value, { onSubmit: (pin) => unlock.dispatch({ pin }) });

    return <PinCodeInput loading={unlock.loading} value={value} onValue={setValue} />;
};
