import type { Rect } from '@proton/pass/types/utils/dom';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

const REFRESH_RATE = 1000 / 24;

export const animatePositionChange = (options: {
    /** Resolve the bounding client rect for comparison */
    get: () => Partial<Rect>;
    set?: (rect: Partial<Rect>) => void;
    onComplete?: (timestamp: number) => void;
    onAnimate: (request: number) => void;
}): void => {
    const current = options.get();
    let { top, left, right, bottom } = current;
    options.set?.(current);
    let updatedAt = 0;

    const check = () =>
        options.onAnimate(
            requestAnimationFrame((timestamp) => {
                if (timestamp - updatedAt >= REFRESH_RATE) {
                    updatedAt = timestamp;
                    const next = options.get();
                    const { top: nTop, left: nLeft, right: nRight, bottom: nBottom } = next;
                    if (nTop !== top || nLeft !== left || nRight !== right || nBottom !== bottom) {
                        options.set?.(next);
                        top = nTop;
                        left = nLeft;
                        right = nRight;
                        bottom = nBottom;
                        check();
                    } else options.onComplete?.(timestamp);
                } else check();
            })
        );

    return check();
};

/** Waits for element to reach a stable animation state before proceeding.
 * Skips pending animations, waits for ready state on active ones.
 * Waiting for 'ready' instead of 'finished' (potentially seconds) gives us a
 * stable-enough state for layout calculations without unnecessary delay.
 * Timeout prevents hanging on infinite/buggy animations */
export const waitForTransitions = safeAsyncCall(async (element: HTMLElement, timeout: number = 500) => {
    const animations = element.getAnimations({ subtree: true }).filter(({ pending }) => !pending);
    await Promise.race([wait(timeout), Promise.all(animations.map(({ ready }) => ready)).catch(noop)]);
});

export const freezeAnimations = (element: HTMLElement): (() => void) => {
    const transition = element.style.transition;
    const animation = element.style.animation;

    element.style.setProperty('transition', 'none', 'important');
    element.style.setProperty('animation', 'none', 'important');

    return () => {
        if (transition) element.style.setProperty('transition', transition);
        else element.style.removeProperty('transition');

        if (animation) element.style.setProperty('animation', animation);
        else element.style.removeProperty('animation');
    };
};
