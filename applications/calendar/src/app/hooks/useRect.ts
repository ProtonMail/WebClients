import { useLayoutEffect, useState } from 'react';
import observeRect, { Rect } from './observeRect';

export function useRect(nodeRef: HTMLElement | null, observe = true, once = false, dependency?: any) {
    const [rect, setRect] = useState<Rect | undefined>(undefined);

    useLayoutEffect(() => {
        if (!nodeRef || !observe) {
            setRect(undefined);
            return;
        }

        if (once) {
            let onceState = false;

            const stop = observeRect(nodeRef, (rect: Rect) => {
                if (!onceState) {
                    onceState = true;
                    stop();
                    setRect(rect);
                }
            });

            return stop;
        }

        return observeRect(nodeRef, (rect) => {
            setRect(rect);
        });
    }, [nodeRef, observe, once, dependency]);

    return rect;
}
