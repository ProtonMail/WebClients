import { useLayoutEffect, useState } from 'react';
import observeRect from './observeRect';

export function useRect(nodeRef, observe = true, once = false, dependency) {
    const [rect, setRect] = useState();

    useLayoutEffect(() => {
        if (!nodeRef || !observe) {
            setRect();
            return;
        }

        if (once) {
            let onceState = false;

            const stop = observeRect(nodeRef, (rect) => {
                if (!onceState) {
                    onceState = true;
                    stop();
                    setRect(rect);
                }
            });

            return stop;
        }

        return observeRect(nodeRef, (rect) => {
            setRect(rect)
        });
    }, [nodeRef, observe, once, dependency]);

    return rect;
}
