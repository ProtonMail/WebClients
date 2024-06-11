import { useEffect, useRef } from 'react';

import type { Maybe } from '@proton/pass/types/utils';

const FOCUS_CHECK_DELAY = 10;

export const isDocumentVisible = () => document.visibilityState === 'visible';
export const isDocumentFocused = () => document.hasFocus();

export const useVisibleEffect = (effect: (visible: boolean) => void, deps: any[] = []) => {
    const timer = useRef<Maybe<NodeJS.Timeout>>();
    const active = useRef<boolean>(false);

    const onVisibilityChange = useRef(effect);
    onVisibilityChange.current = effect;

    useEffect(() => {
        active.current = false;

        const handler = () => {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                const wasActive = active.current;
                const isActive = isDocumentVisible() || isDocumentFocused();

                if (wasActive !== isActive) {
                    active.current = isActive;
                    onVisibilityChange.current(isActive);
                }
            }, FOCUS_CHECK_DELAY);
        };

        window.addEventListener('focus', handler);
        window.addEventListener('blur', handler);
        document.addEventListener('visibilitychange', handler);

        handler();

        return () => {
            window.removeEventListener('focus', handler);
            window.removeEventListener('blur', handler);
            document.removeEventListener('visibilitychange', handler);
            return clearTimeout(timer.current);
        };
    }, deps);
};
