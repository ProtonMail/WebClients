import type { FC, PropsWithChildren } from 'react';
import { createContext, useEffect, useMemo, useRef } from 'react';

import { DROPDOWN_FOCUS_TIMEOUT } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.focus';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { Callback, MaybeNull } from '@proton/pass/types';
import { onNextTick } from '@proton/pass/utils/time/next-tick';

export const FOCUS_RECOVERY_TIMEOUT = 150;

export type IFrameFocusControllerValue = { blurTrap: (fn: Callback, duration?: number) => void };
export const IFrameFocusControllerContext = createContext<MaybeNull<IFrameFocusControllerValue>>(null);
export const useFocusController = createUseContext(IFrameFocusControllerContext);

export const useBlurTrap = () => {
    const { blurTrap } = useFocusController();
    return <T extends Callback>(fn: T, duration?: number) =>
        ((...args: Parameters<T>) => blurTrap(() => fn(...args), duration)) as T;
};

/** During autofill sequences, focus temporarily shifts between fields and frames which
 * can trigger blur events that would close the dropdown prematurely. This breaks the
 * refocus logic that should execute after successful autofill completion.
 *
 * We monitor blur events on the iframe to catch real dismisses when the frame has focus.
 * In cases where the frame is in the same document, we may miss re-focus events, so the
 * blurTrap method provides a grace period during which blur events are ignored. */
export const DropdownFocusController: FC<PropsWithChildren> = ({ children }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const trap = useRef<MaybeNull<NodeJS.Timeout>>();

    const context = useMemo<IFrameFocusControllerValue>(
        () => ({
            blurTrap: (fn, duration = DROPDOWN_FOCUS_TIMEOUT) => {
                if (trap.current) clearTimeout(trap.current);
                trap.current = setTimeout(() => (trap.current = null), duration);
                fn();
            },
        }),
        []
    );

    useEffect(() => {
        const onBlur = onNextTick(() => {
            if (!trap.current) {
                window.removeEventListener('blur', onBlur);
                controller.close();
            }
        });

        if (visible) window.addEventListener('blur', onBlur);

        return () => {
            window.removeEventListener('blur', onBlur);
            if (trap.current) {
                clearTimeout(trap.current);
                trap.current = null;
            }
        };
    }, [visible]);

    return <IFrameFocusControllerContext.Provider value={context}>{children}</IFrameFocusControllerContext.Provider>;
};
