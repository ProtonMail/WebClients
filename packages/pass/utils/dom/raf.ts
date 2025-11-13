import type { MaybeNull } from '@proton/pass/types';

export type RafHandle = {
    /** Flag indicating wether the current RAF
     * has been cancelled. NOTE: Do not destructure
     * as this property is a dynamic getter */
    cancelled: boolean;
};

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
    const request = (fn: (handle: RafHandle) => void) => {
        cancel();
        const next = requestAnimationFrame(() =>
            fn({
                get cancelled() {
                    return next !== raf;
                },
            })
        );
        raf = next;
    };

    return {
        cancel,
        request,
        get handle() {
            return raf;
        },
    };
};
