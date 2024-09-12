import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PinCodeInput } from '@proton/pass/components/Lock/PinCodeInput';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { clientSessionLocked } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';

type Props = { header?: ReactNode; onUnlock?: () => void };

export const PinUnlock: FC<Props> = ({ header, onUnlock }) => {
    const { visible } = useIFrameContext();
    const [value, setValue] = useMountedState<string>('');
    const [loading, setLoading] = useMountedState<boolean>(false);
    const [error, setError] = useMountedState<MaybeNull<string>>(null);

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
    const { status } = useAppState().state;
    const locked = clientSessionLocked(status);
    const input = locked ? <PinUnlock {...props} /> : null;

    return children(locked, input);
};
