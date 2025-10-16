import type { FC, PropsWithChildren } from 'react';
import { createContext, useEffect, useMemo, useRef } from 'react';

import { DROPDOWN_FOCUS_TIMEOUT } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.focus';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { Callback, MaybeNull } from '@proton/pass/types';

import { useIFrameAppController, useIFrameAppState } from './IFrameApp';

type IFrameFocusControllerValue = { blurTrap: (fn: Callback) => void };
const IFrameFocusControllerContext = createContext<MaybeNull<IFrameFocusControllerValue>>(null);
export const useFocusController = createUseContext(IFrameFocusControllerContext);

export const useBlurTrap = () => {
    const { blurTrap } = useFocusController();
    return <T extends Callback>(fn: T) => ((...args: Parameters<T>) => blurTrap(() => fn(...args))) as T;
};

/** During autofill sequences, focus temporarily shifts between fields and frames which
 * can trigger blur events that would close the dropdown prematurely. This breaks the
 * refocus logic that should execute after successful autofill completion.
 *
 * We monitor blur events on the iframe to catch real dismisses when the frame has focus.
 * In cases where the frame is in the same document, we may miss re-focus events, so the
 * blurTrap method provides a grace period during which blur events are ignored. */
export const IFrameFocusController: FC<PropsWithChildren> = ({ children }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const trap = useRef<MaybeNull<NodeJS.Timeout>>();

    const context = useMemo<IFrameFocusControllerValue>(
        () => ({
            blurTrap: (fn) => {
                if (trap.current) {
                    clearTimeout(trap.current);
                    trap.current = null;
                }

                trap.current = setTimeout(() => (trap.current = null), DROPDOWN_FOCUS_TIMEOUT);
                fn();
            },
        }),
        []
    );

    useEffect(() => {
        const onBlur = () => !trap.current && controller.close();

        if (visible) window.addEventListener('blur', onBlur, { once: true });

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
