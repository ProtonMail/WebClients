import { type FC, type ForwardRefRenderFunction, type ReactNode, forwardRef } from 'react';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useLockAutoSubmit } from '@proton/pass/hooks/auth/useLockAutoSubmit';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { clientSessionLocked } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';

export type Props = {
    header?: ReactNode;
    onUnlock?: () => void;
};

/** Focus control is delegated to resolve focus-traps. */
const PinUnlockRender: ForwardRefRenderFunction<HTMLInputElement, Props> = ({ header, onUnlock }, focusRef) => {
    const [value, setValue] = useMountedState<string>('');
    const [loading, setLoading] = useMountedState<boolean>(false);
    const [error, setError] = useMountedState<MaybeNull<string>>(null);
    const [autofocus, setAutofocus] = useMountedState(false);

    const [key, rerender] = useRerender('pin-input');

    /** On unlock failure, we can take back control of
     * the autofocus mechanism as the inlined app has
     * already gained focus */
    const unlock = useUnlock((error) => {
        setValue('');
        setError(error.message);
        setAutofocus(true);
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

    return (
        <div className="flex-auto px-4 py-3">
            {header}
            <PinCodeInput
                autoFocus={autofocus}
                key={key}
                loading={loading}
                onValue={setValue}
                ref={focusRef}
                value={value}
            />
            {error && <div className="text-center text-sm color-danger mt-3">{error}</div>}
        </div>
    );
};

export const PinUnlock = forwardRef(PinUnlockRender);

export const WithPinUnlock: FC<Props & { children: (locked: boolean, input: ReactNode) => ReactNode }> = ({
    children,
    ...props
}) => {
    const { status } = useAppState();
    const locked = clientSessionLocked(status);
    const input = locked ? <PinUnlock {...props} /> : null;

    return children(locked, input);
};
