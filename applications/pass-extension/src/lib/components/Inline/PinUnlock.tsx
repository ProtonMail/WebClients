import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useLockAutoSubmit } from '@proton/pass/hooks/auth/useLockAutoSubmit';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { clientSessionLocked } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useIFrameAppController, useIFrameAppState } from './IFrameApp';

type Props = { header?: ReactNode; onUnlock?: () => void };

export const PinUnlock: FC<Props> = ({ header, onUnlock }) => {
    const { visible } = useIFrameAppState();
    const [value, setValue] = useMountedState<string>('');
    const [loading, setLoading] = useMountedState<boolean>(false);
    const [error, setError] = useMountedState<MaybeNull<string>>(null);

    const ctrl = useIFrameAppController();

    /* Re-render the PIN input with correct input focus */
    const [key, rerender] = useRerender('pin-input');

    const unlock = useUnlock((err) => {
        setValue('');
        setError(err.message);
        rerender();
    });

    const onSubmit = async (secret: string) => {
        try {
            setLoading(true);
            setError(null);
            await unlock({ mode: LockMode.SESSION, secret });
            onUnlock?.();
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useLockAutoSubmit(value, { onSubmit });

    useEffect(() => {
        if (visible) {
            /** Force blur the parent field if dropdown becomes visible
             * This helps when the dropdown has trouble gaining focus due
             * to strict focus management in certain websites */
            const ensureFocused = () => ctrl.forwardMessage({ type: InlinePortMessageType.DROPDOWN_FOCUS_REQUEST });
            const onFocused = () => ctrl.forwardMessage({ type: InlinePortMessageType.DROPDOWN_FOCUSED });
            const onFocus = pipe(rerender, onFocused);

            const timer = setTimeout(ensureFocused, 150);
            const unregister = ctrl.registerHandler(InlinePortMessageType.DROPDOWN_FOCUS, onFocus);

            return () => {
                unregister();
                clearTimeout(timer);
            };
        } else setError(null);
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
    const { status } = useAppState();
    const locked = clientSessionLocked(status);
    const input = locked ? <PinUnlock {...props} /> : null;

    return children(locked, input);
};
