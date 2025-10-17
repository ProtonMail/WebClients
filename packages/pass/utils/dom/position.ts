import type { Rect } from '@proton/pass/types/utils/dom';

const REFRESH_RATE = 1000 / 24;

export const animatePositionChange = (options: {
    get: () => Partial<Rect>;
    set: (rect: Partial<Rect>) => void;
    onAnimate: (request: number) => void;
}): void => {
    const current = options.get();
    let { top, left, right, bottom } = current;
    options.set(current);
    let updatedAt = 0;

    const check = () =>
        options.onAnimate(
            requestAnimationFrame((timestamp) => {
                if (timestamp - updatedAt >= REFRESH_RATE) {
                    updatedAt = timestamp;
                    const next = options.get();
                    const { top: nTop, left: nLeft, right: nRight, bottom: nBottom } = next;
                    if (nTop !== top || nLeft !== left || nRight !== right || nBottom !== bottom) {
                        options.set(next);
                        top = nTop;
                        left = nLeft;
                        right = nRight;
                        bottom = nBottom;
                        check();
                    }
                } else check();
            })
        );

    return check();
};
