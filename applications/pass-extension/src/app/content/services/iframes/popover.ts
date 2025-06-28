import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import type { IFrameService } from 'proton-pass-extension/app/content/services/iframes/service';

import type { CustomElementRef } from '@proton/pass/utils/dom/create-element';
import { hidePopover, showPopover } from '@proton/pass/utils/dom/popover';

export interface PopoverController {
    root: CustomElementRef<ProtonPassRoot>;
    open: () => void;
    close: () => void;
}

export const createPopoverController = (service: IFrameService, enabled: boolean): PopoverController => {
    /** Bind the controller to the current root element */
    const root = service.root;

    return {
        root,
        open: () => {
            if (enabled) {
                root.customElement.setAttribute('popover', 'manual');
                showPopover(root.customElement);
            } else root.customElement.removeAttribute('popover');
        },
        close: () => {
            if (enabled) {
                const { dropdown, notification } = service;
                /** Prevents closing the root popover when both dropdown and
                 * notification are active. Since both apps share the same
                 * popover container, closing one should not affect the other */
                if (dropdown?.getState().visible && notification?.getState().visible) return;
                else hidePopover(root.customElement);
            }
        },
    };
};
