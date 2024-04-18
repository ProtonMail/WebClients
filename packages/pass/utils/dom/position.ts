import type { Rect } from '@proton/pass/types/utils/dom';

export const animatePositionChange = (options: {
    get: () => Partial<Rect>;
    set: () => void;
    onAnimate: (request: number) => void;
}): void => {
    options.set();
    let { top, left, right, bottom } = options.get();

    const check = () =>
        options.onAnimate(
            requestAnimationFrame(() => {
                const { top: nTop, left: nLeft, right: nRight, bottom: nBottom } = options.get();
                if (nTop !== top || nLeft !== left || nRight !== right || nBottom !== bottom) {
                    options.set();
                    top = nTop;
                    left = nLeft;
                    right = nRight;
                    bottom = nBottom;
                    check();
                }
            })
        );

    return check();
};
