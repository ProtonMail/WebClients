import type { FC, PropsWithChildren, RefObject } from 'react';
import { createContext, useEffect, useMemo, useRef } from 'react';

import { DROPDOWN_FOCUS_TIMEOUT } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.focus';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils/index';
import { onNextTick } from '@proton/pass/utils/time/next-tick';

export type IFrameFocusControllerValue = { focusRef: RefObject<HTMLInputElement> };

export const IFrameFocusControllerContext = createContext<MaybeNull<IFrameFocusControllerValue>>(null);
export const useFocusController = createUseContext(IFrameFocusControllerContext);

/** Maximum number of focus recovery attempts before giving up.
 * Prevents infinite loops when aggressive focus-lock libraries
 * repeatedly steal focus back to trapped fields */
const MAX_FOCUS_RECOVERY_RETRIES = 5;

/** Manages focus and blur events for the dropdown iframe to handle both
 * user dismissals and focus-lock interference from the host page */
export const DropdownFocusController: FC<PropsWithChildren> = ({ children }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const focusRef = useRef<HTMLInputElement>(null);
    const retryCount = useRef(0);

    const context = useMemo<IFrameFocusControllerValue>(() => ({ focusRef }), []);

    useEffect(() => {
        let focusTimeout: Maybe<NodeJS.Timeout>;
        let blurTimeout: Maybe<NodeJS.Timeout>;

        retryCount.current = 0;

        const onBlur = () => {
            clearTimeout(blurTimeout);
            blurTimeout = setTimeout(() => {
                if (!document.hasFocus()) {
                    controller.forwardMessage({ type: InlinePortMessageType.DROPDOWN_BLURRED });
                }
            }, DROPDOWN_FOCUS_TIMEOUT);
        };

        /** Handles focus events with detection for focus-lock interference.
         * After gaining focus, we verify that focus persists after a short delay.
         * If focus was stolen back by a focus-lock library, we request focus recovery
         * from the content script which will use the "blur-before-focus" bypass strategy. */
        const onFocus = () => {
            clearTimeout(focusTimeout);
            clearTimeout(blurTimeout);
            controller.forwardMessage({ type: InlinePortMessageType.DROPDOWN_FOCUSED });

            focusTimeout = setTimeout(() => {
                if (document.hasFocus()) retryCount.current = 0;
                else if (retryCount.current < MAX_FOCUS_RECOVERY_RETRIES) {
                    /** Focus was stolen: request recovery */
                    clearTimeout(blurTimeout);
                    retryCount.current += 1;
                    controller.forwardMessage({ type: InlinePortMessageType.DROPDOWN_FOCUS_REQUEST });
                }
            }, DROPDOWN_FOCUS_TIMEOUT);
        };

        const onMouseDown = () => {
            if (!document.hasFocus()) onFocus();
            window.removeEventListener('mousedown', onMouseDown, { capture: true });
        };

        if (visible) {
            window.addEventListener('blur', onBlur);
            window.addEventListener('focus', onFocus);
            window.addEventListener('mousedown', onMouseDown, { capture: true });

            const unregister = controller.registerHandler(
                InlinePortMessageType.DROPDOWN_FOCUS,
                onNextTick(() => (focusRef.current ?? window)?.focus())
            );

            return () => {
                unregister();
                clearTimeout(focusTimeout);
                clearTimeout(blurTimeout);
                window.removeEventListener('focus', onFocus);
                window.removeEventListener('blur', onBlur);
                window.removeEventListener('mousedown', onMouseDown, { capture: true });
            };
        }
    }, [visible]);

    return <IFrameFocusControllerContext.Provider value={context}>{children}</IFrameFocusControllerContext.Provider>;
};
