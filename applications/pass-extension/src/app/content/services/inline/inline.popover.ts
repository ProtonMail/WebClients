import type { CustomElementRef } from '@proton/pass/utils/dom/create-element';
import { POPOVER_SUPPORTED, hidePopover, showPopover } from '@proton/pass/utils/dom/popover';

import type { ProtonPassRoot } from './custom-elements/ProtonPassRoot';
import type { InlineRegistry } from './inline.registry';

export interface PopoverController {
    root: CustomElementRef<ProtonPassRoot>;
    open: () => void;
    close: () => void;
}

export const createPopoverController = (registry: InlineRegistry): PopoverController => {
    /** Bind the controller to the current root element */
    const root = registry.root;

    return {
        root,
        open: () => {
            if (POPOVER_SUPPORTED) {
                root.customElement.setAttribute('popover', 'manual');
                showPopover(root.customElement);
            } else root.customElement.removeAttribute('popover');
        },
        close: () => {
            if (POPOVER_SUPPORTED) {
                const { dropdown, notification } = registry;
                /** Prevents closing the root popover when both dropdown and
                 * notification are active. Since both apps share the same
                 * popover container, closing one should not affect the other */
                if (dropdown?.getState().visible || notification?.getState().visible) return;
                else hidePopover(root.customElement);
            }
        },
    };
};
