export const findUpwards = (target: HTMLElement, outOfBoundsElement: HTMLElement, cb: (el: HTMLElement) => boolean) => {
    let current: HTMLElement | null = target;
    do {
        if (!current) {
            return;
        }
        if (cb(current)) {
            return current;
        }
        if (current === outOfBoundsElement) {
            return;
        }
        current = current.parentElement;
        // eslint-disable-next-line no-constant-condition
    } while (true);
};

export const findContainingParent = (container: HTMLElement | ChildNode, target: HTMLElement) => {
    for (let i = 0; i < container.childNodes.length; ++i) {
        const node = container.childNodes[i];
        if (node.contains(target)) {
            return i;
        }
    }
    return -1;
};

export const blockClick = () => {
    let cancel: () => void;

    const block = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        cancel();
    };

    let done = false;
    const handleMouseUp = () => {
        if (done) {
            return;
        }
        done = true;
        setTimeout(() => {
            cancel();
        }, 1);
    };

    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('click', block, true);

    cancel = () => {
        document.removeEventListener('mouseup', handleMouseUp, true);
        document.removeEventListener('click', block, true);
    };

    return cancel;
};

export const createAutoScroll = (container: HTMLElement, { marginTop = 5, marginBottom = 5, speed = 5 } = {}) => {
    const rect = container.getBoundingClientRect();
    let stopScrolling: (() => void) | undefined;

    const startScrolling = (direction: 1 | -1) => {
        let stop = false;
        const cb = () => {
            if (stop) {
                return;
            }
            const pre = container.scrollTop;
            container.scrollTop = pre + direction * speed;
            if (container.scrollTop === pre) {
                return;
            }
            requestAnimationFrame(cb);
        };
        cb();
        return () => {
            stop = true;
        };
    };

    const onMouseMove = ({ pageY }: MouseEvent) => {
        if (pageY <= rect.top + marginTop) {
            if (!stopScrolling) {
                stopScrolling = startScrolling(-1);
            }
            return;
        }
        if (pageY >= rect.bottom - marginBottom) {
            if (!stopScrolling) {
                stopScrolling = startScrolling(+1);
            }
            return;
        }
        if (stopScrolling) {
            stopScrolling();
            stopScrolling = undefined;
        }
    };

    const onMouseUp = () => {
        if (stopScrolling) {
            stopScrolling();
            stopScrolling = undefined;
        }
    };

    return {
        onMouseMove,
        onMouseUp,
    };
};

export const createRafUpdater = () => {
    let last: (() => void) | undefined;

    const run = () => {
        if (last) {
            last();
            last = undefined;
        }
    };

    return (cb: () => void) => {
        const prevLast = last;
        last = cb;
        // If the prev raf has not been consumed, schedule it to run
        if (!prevLast) {
            requestAnimationFrame(run);
        }
    };
};
