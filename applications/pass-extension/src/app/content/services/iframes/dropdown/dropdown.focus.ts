import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { DropdownAnchorRef } from 'proton-pass-extension/app/content/services/iframes/dropdown/dropdown.app';
import type { IFrameApp } from 'proton-pass-extension/app/content/services/iframes/factory';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import { isHTMLElement } from '@proton/pass/utils/dom/predicates';

export interface DropdownFocusController {
    focused: boolean;
    willFocus: boolean;
    disconnect: () => void;
    onFocus: () => void;
    onWillFocus: () => void;
}

type DropdownFocusManagerOptions = {
    iframe: IFrameApp<DropdownAction>;
    popover: PopoverController;
    anchor: DropdownAnchorRef;
};

type DropdownFocusManagerState = { willFocus: boolean; willFocusTimer?: NodeJS.Timeout };

export const createDropdownFocusController = ({
    iframe,
    popover,
    anchor,
}: DropdownFocusManagerOptions): DropdownFocusController => {
    const state: DropdownFocusManagerState = { willFocus: false };

    const refocus = () => {
        const { activeElement } = document;
        if (activeElement && isHTMLElement(activeElement)) activeElement.blur();
        iframe.sendPortMessage({ type: IFramePortMessageType.DROPDOWN_FOCUS });
    };

    const onFocus = () => {
        clearTimeout(state.willFocusTimer);
        delete state.willFocusTimer;
        state.willFocus = false;
    };

    const onWillFocus = () => {
        clearTimeout(state.willFocusTimer);
        state.willFocus = true;
        state.willFocusTimer = setTimeout(onFocus, 500);
    };

    /** Only used when dropdown UI has input elements that may lose focus
     * due to page code. This can happen if blur/focus management is too
     * strict (eg: ticketmaster.com) where the dropdown can never get a
     * full focus. In this case, blur the anchor field and force the active
     * element to blur to ensure we're in an "unfocused state". */
    const onFocusRequest = () => {
        state.willFocus = true;

        if (document.activeElement !== popover.root.customElement) {
            switch (anchor.current?.type) {
                case 'field':
                    anchor.current?.field.element.blur();
                    setTimeout(refocus, 50);
                    break;
                case 'frame':
                    refocus();
                    break;
            }
        }
    };

    iframe.registerMessageHandler(IFramePortMessageType.DROPDOWN_FOCUS_REQUEST, onFocusRequest);
    iframe.registerMessageHandler(IFramePortMessageType.DROPDOWN_FOCUSED, onFocus);

    return {
        get focused() {
            return isActiveElement(popover.root.customElement);
        },
        get willFocus() {
            return state.willFocus;
        },
        onFocus,
        onWillFocus,
        disconnect: () => clearTimeout(state.willFocusTimer),
    };
};
