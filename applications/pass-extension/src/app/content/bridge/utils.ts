import type { ExportFunction } from 'applications/pass-extension/globals';

/** Exports a function defined within the content-script to
the scope of the page script. This is necessary for Firefox.
For Chromium, fallback to directly assigning to the target. */
export const exporter: ExportFunction = (fn, target, options) =>
    globalThis.exportFunction?.(fn, target, options) ?? (target[options.defineAs] = fn);

/** Clones an object from the isolated content-script world into
 * the main world of the page-script. This is necessary for Firefox,
 * which does not support declarative world isolation. */
export const clone = <T>(obj: T): T =>
    globalThis.cloneInto?.(obj, window, {
        cloneFunctions: true,
        wrapReflectors: true,
    }) ?? obj;

/** A Promise cannot be cloned directly using cloneInto, as Promise
 * is not supported by the structured clone algorithm. However, the
 * desired result can be achieved using window.Promise instead of Promise */
export const promise = <T>(
    executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (error: unknown) => void) => void
) => new window.Promise(executor);
