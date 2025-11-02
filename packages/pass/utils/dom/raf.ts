import type { MaybeNull } from '@proton/pass/types';

export const createRAFController = () => {
    let raf: MaybeNull<number> = null;

    const cancel = () => {
        if (raf !== null) cancelAnimationFrame(raf);
        raf = null;
    };

    /** Schedules a callback for the next animation frame.
     * Automatically cancels any pending request.
     * @param fn - Callback receiving the RAF handle as a parameter.
     * For async callbacks, compare `handle` against `controller.handle`
     * to determine if this request is still active after awaiting. */
    const request = (fn: (handle: number) => void) => {
        cancel();
        const handle = requestAnimationFrame(() => fn(handle));
        raf = handle;
    };

    return {
        cancel,
        request,
        get handle() {
            return raf;
        },
    };
};
