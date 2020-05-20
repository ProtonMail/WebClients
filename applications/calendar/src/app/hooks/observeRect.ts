export interface Rect {
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
}

type Callback = (rect: Rect) => void;

const props = ['width', 'height', 'top', 'right', 'bottom', 'left'];

const rectChanged = (a: any = {}, b: any = {}) => props.some((prop) => a[prop] !== b[prop]);

const observedNodes = new Map();
let rafId = 0;

const run = () => {
    observedNodes.forEach((state) => {
        if (state.hasRectChanged) {
            state.callbacks.forEach((cb: Callback) => cb(state.rect));
            state.hasRectChanged = false;
        }
    });

    setTimeout(() => {
        observedNodes.forEach((state, node) => {
            const newRect = node.getBoundingClientRect();
            if (rectChanged(newRect, state.rect)) {
                state.hasRectChanged = true;
                state.rect = newRect;
            }
        });
    }, 0);

    rafId = requestAnimationFrame(run);
};

export default (node: HTMLElement, cb: Callback) => {
    const wasEmpty = observedNodes.size === 0;

    if (observedNodes.has(node)) {
        const { callbacks, rect, hasRectChanged } = observedNodes.get(node);
        callbacks.push(cb);
        if (rect && !hasRectChanged) {
            cb(rect);
        }
    } else {
        observedNodes.set(node, {
            rect: undefined,
            hasRectChanged: false,
            callbacks: [cb],
        });
    }
    if (wasEmpty) {
        run();
    }

    return () => {
        const state = observedNodes.get(node);
        if (!state) {
            return;
        }
        const index = state.callbacks.indexOf(cb);
        if (index >= 0) {
            state.callbacks.splice(index, 1);
        }
        if (!state.callbacks.length) {
            observedNodes.delete(node);
        }
        if (!observedNodes.size) {
            cancelAnimationFrame(rafId);
        }
    };
};
