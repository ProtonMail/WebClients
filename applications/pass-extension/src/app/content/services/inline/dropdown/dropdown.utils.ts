import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { DROPDOWN_FOCUS_TIMEOUT } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.focus';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import { nextTick } from '@proton/pass/utils/time/next-tick';

/** Handles field cleanup when dropdown closes, preventing race conditions.
 * Uses actionTrap to block interactions during transitions and nextTick
 * to ensure DOM state has settled before focus/icon operations. */
export const onFieldDropdownClose = (field: FieldHandle, refocus: boolean) => {
    if (!refocus) actionTrap(field.element, DROPDOWN_FOCUS_TIMEOUT);

    nextTick(() => {
        if (refocus) field.focus();
        else if (!isActiveElement(field.element)) field.detachIcon();
    });
};
