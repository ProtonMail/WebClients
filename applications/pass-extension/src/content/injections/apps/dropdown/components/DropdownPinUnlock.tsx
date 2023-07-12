import type { VFC } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PinCodeInput } from '../../../../../shared/components/session-lock/PinCodeInput';
import { useSessionLockPinSubmitEffect } from '../../../../../shared/components/session-lock/useSessionLockPinSubmitEffect';
import { useEnsureMounted } from '../../../../../shared/hooks/useEnsureMounted';
import { DropdownItemIcon } from './DropdownItemIcon';

export const DropdownPinUnlock: VFC<{
    onError?: () => void;
    onUnlock?: () => void;
    visible?: boolean;
}> = ({ onError, onUnlock, visible }) => {
    const ensureMounted = useEnsureMounted();
    const [value, setValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<MaybeNull<string>>(null);

    const onSubmit = useCallback(async (value: string) => {
        try {
            setLoading(true);
            await sendMessage.onSuccess(
                pageMessage({ type: WorkerMessageType.UNLOCK_REQUEST, payload: { pin: value } }),
                (res) => {
                    if (!res.ok) {
                        ensureMounted(setError)(res.reason);
                        return onError?.(); /* notify parent component we need an iframe resize */
                    }
                    if (res.ok) onUnlock?.();
                }
            );
        } catch (_) {
        } finally {
            ensureMounted(setLoading)(false);
        }
    }, []);

    useSessionLockPinSubmitEffect(value, { onSubmit });

    useEffect(() => {
        if (!visible) setError(null);
    }, [visible]);

    return (
        <div className="px-4 py-3">
            <div className="flex flex-align-items-center gap-3 mb-3">
                <DropdownItemIcon icon={PassIconStatus.LOCKED_DROPDOWN} />
                <div className="flex-item-fluid">
                    <span className="block text-ellipsis">{c('Title').t`Unlock ${PASS_APP_NAME}`}</span>
                    <span className={clsx('block color-weak text-sm text-ellipsis')}>{c('Info')
                        .t`Enter your pin code`}</span>
                </div>
            </div>

            <PinCodeInput loading={loading} value={value} onValue={setValue} autoFocus={visible} />
            {error && <div className="text-center text-sm color-danger mt-3">{error}</div>}
        </div>
    );
};
