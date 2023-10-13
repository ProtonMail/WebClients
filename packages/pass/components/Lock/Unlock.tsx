import { type VFC, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { sessionUnlockIntent } from '@proton/pass/store/actions';
import { unlockSession } from '@proton/pass/store/actions/requests';
import { selectRequestStatus } from '@proton/pass/store/selectors';

export const Unlock: VFC = () => {
    const dispatch = useDispatch();
    const [value, setValue] = useState('');
    const status = useSelector(selectRequestStatus(unlockSession));
    const loading = status && status !== 'failure';

    useSessionLockPinSubmitEffect(value, {
        onSubmit: useCallback((pin) => dispatch(sessionUnlockIntent({ pin })), []),
    });

    return <PinCodeInput loading={loading} value={value} onValue={setValue} />;
};
