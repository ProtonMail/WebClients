import type { Rect } from '../../types/utils/dom';

export const animatePositionChange = (position: { get: () => Partial<Rect>; set: () => void }): number => {
    position.set();
    let { top, left, right, bottom } = position.get();

    const check = (): number =>
        requestAnimationFrame(() => {
            const { top: nTop, left: nLeft, right: nRight, bottom: nBottom } = position.get();
            if (nTop !== top || nLeft !== left || nRight !== right || nBottom !== bottom) {
                position.set();
                top = nTop;
                left = nLeft;
                right = nRight;
                bottom = nBottom;
                check();
            }
        });

    return check();
};
