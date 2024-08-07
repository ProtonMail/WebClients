import type { Rect } from '@proton/pass/types/utils/dom';

const REFRESH_RATE = 1000 / 24;

export const animatePositionChange = (options: {
    get: () => Partial<Rect>;
    set: () => void;
    onAnimate: (request: number) => void;
}): void => {
    options.set();
    let { top, left, right, bottom } = options.get();
    let updatedAt = 0;

    const check = () =>
        options.onAnimate(
            requestAnimationFrame((timestamp) => {
                if (timestamp - updatedAt >= REFRESH_RATE) {
                    updatedAt = timestamp;
                    const { top: nTop, left: nLeft, right: nRight, bottom: nBottom } = options.get();
                    if (nTop !== top || nLeft !== left || nRight !== right || nBottom !== bottom) {
                        options.set();
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
