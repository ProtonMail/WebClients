import type { InlineRegistry } from '../inline.registry';
import type { InlineToastHandler } from './toast.abstract';

export const createToastHandler = (registry: InlineRegistry): InlineToastHandler => ({
    attach: () => registry.attachToast(),
    open: (request) => registry.attachToast()?.open(request),
    close: (action) => {
        /* If an action is passed as a parameter, only close the
         * toast if it is currently attached to this action. */
        if (action && registry.toast?.getState().action !== action) return;
        registry.toast?.close();
    },
    destroy: () => registry.toast?.destroy(),
});
