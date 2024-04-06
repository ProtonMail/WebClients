import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';

import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

type Props = { header?: ReactNode; onUnlock?: () => void };

export const PinUnlock: FC<Props> = ({ header, onUnlock }) => {
    const { visible } = useIFrameContext();
    const [value, setValue] = useMountedState<string>('');
    const [loading, setLoading] = useMountedState<boolean>(false);
    const [error, setError] = useMountedState<MaybeNull<string>>(null);

    /* Re-render the PIN input with correct input focus */
    const [key, rerender] = useRerender('pin-input');

    const onSubmit = async (value: string) => {
        try {
            setLoading(true);
            setError(null);
            await sendMessage.onSuccess(
                contentScriptMessage({ type: WorkerMessageType.AUTH_UNLOCK, payload: { pin: value } }),
                (res) => {
                    if (!res.ok) {
                        setValue('');
                        setError(res.error);
                        rerender();
                    } else onUnlock?.();
                }
            );
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useSessionLockPinSubmitEffect(value, { onSubmit });

    useEffect(() => {
        if (!visible) setError(null);
    }, [visible]);

    return (
        <div className="flex-auto px-4 py-3">
            {header}
            <PinCodeInput key={key} loading={loading} value={value} onValue={setValue} autoFocus={visible} />
            {error && <div className="text-center text-sm color-danger mt-3">{error}</div>}
        </div>
    );
};

export const WithPinUnlock: FC<Props & { children: (locked: boolean, input: ReactNode) => ReactNode }> = ({
    children,
    ...props
}) => {
    const { appState } = useIFrameContext();
    const { status } = appState;
    const locked = clientSessionLocked(status);
    const input = locked ? <PinUnlock {...props} /> : null;

    return children(locked, input);
};
