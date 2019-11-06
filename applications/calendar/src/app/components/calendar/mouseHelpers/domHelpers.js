
export const findUpwards = (target, outOfBoundsElement, cb) => {
    let current = target;
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

export const findContainingParent = (container, target) => {
    for (let i = 0; i < container.childNodes.length; ++i) {
        const node = container.childNodes[i];
        if (node.contains(target)) {
            return i;
        }
    }
    return -1;
};
