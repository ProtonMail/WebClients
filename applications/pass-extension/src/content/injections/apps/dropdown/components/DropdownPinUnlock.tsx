import type { VFC } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PinCodeInput } from '../../../../../shared/components/session-lock/PinCodeInput';
import { useEnsureMounted } from '../../../../../shared/hooks/useEnsureMounted';
import { useSessionLockPinSubmitEffect } from '../../../../../shared/hooks/useSessionLockPinSubmitEffect';
import { DropdownItemIcon } from './DropdownItemIcon';

export const DropdownPinUnlock: VFC<{
    onError?: () => void /* notify parent component we need an iframe resize */;
    onUnlock?: () => void;
    visible?: boolean;
}> = ({ onError, onUnlock, visible }) => {
    const ensureMounted = useEnsureMounted();
    const [value, setValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<MaybeNull<string>>(null);

    const onSubmit = async (value: string) => {
        try {
            setLoading(true);
            await sendMessage.onSuccess(
                contentScriptMessage({ type: WorkerMessageType.UNLOCK_REQUEST, payload: { pin: value } }),
                ensureMounted((res) => {
                    if (!res.ok) {
                        setError(res.error);
                        return onError?.();
                    } else onUnlock?.();
                })
            );
        } catch {
        } finally {
            ensureMounted(setLoading)(false);
        }
    };

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
