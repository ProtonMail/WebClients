import type { MaybeNull } from '@proton/pass/types';
import type { Rect } from '@proton/pass/types/utils/dom';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export const REFRESH_RATE = 1000 / 24;

export const animatePositionChange = (options: {
    /** Returns the current bounding rect to track */
    get: () => Partial<Rect>;
    /** Called when position changes are detected */
    set?: (rect: Partial<Rect>) => void;
    /** Called when animation completes (position stable or timeout) */
    onComplete?: (timestamp: number) => void;
    /** Called with each new requestAnimationFrame ID */
    onAnimate: (request: number) => void;
    /** Minimum pixel change to trigger update [default=0.1px] */
    threshold?: number;
    /** Maximum animation duration before force complete [default=500ms] */
    maxDuration?: number;
}): void => {
    const current = options.get();
    const threshold = options.threshold ?? 0.1;
    const maxDuration = options.maxDuration ?? 500;

    options.set?.(current);

    let { top = 0, left = 0, right = 0, bottom = 0 } = current;
    let updatedAt: MaybeNull<number> = null;
    let startedAt: MaybeNull<number> = null;

    const isSignificantChange = ({
        top: nTop = 0,
        left: nLeft = 0,
        right: nRight = 0,
        bottom: nBottom = 0,
    }: Partial<Rect>): boolean =>
        Math.abs(nTop - top) > threshold ||
        Math.abs(nLeft - left) > threshold ||
        Math.abs(nRight - right) > threshold ||
        Math.abs(nBottom - bottom) > threshold;

    const check = () =>
        options.onAnimate(
            requestAnimationFrame((timestamp) => {
                if (updatedAt === null) updatedAt = timestamp;
                if (startedAt === null) startedAt = timestamp;

                if (timestamp - startedAt >= maxDuration) return options.onComplete?.(timestamp);

                if (timestamp - updatedAt >= REFRESH_RATE) {
                    updatedAt = timestamp;
                    const next = options.get();
                    if (isSignificantChange(next)) {
                        options.set?.(next);
                        top = next.top ?? 0;
                        left = next.left ?? 0;
                        right = next.right ?? 0;
                        bottom = next.bottom ?? 0;
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
