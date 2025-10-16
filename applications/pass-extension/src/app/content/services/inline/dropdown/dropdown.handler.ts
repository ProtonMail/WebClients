import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineRegistry } from 'proton-pass-extension/app/content/services/inline/inline.registry';

import type { Maybe } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { onNextTick } from '@proton/pass/utils/time/next-tick';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownAnchor, DropdownRequest } from './dropdown.app';
import { handleBackdrop } from './dropdown.utils';

const willDropdownAnchorChange = (anchor: DropdownAnchor, payload: DropdownRequest): boolean => {
    if (!anchor) return true;

    switch (payload.type) {
        case 'field':
            return anchor.type !== 'field' || anchor.field.element !== payload.field.element;

        case 'frame':
            return (
                anchor.type !== 'frame' ||
                anchor.fieldFrameId !== payload.fieldFrameId ||
                anchor.fieldId !== payload.fieldId
            );
    }
};

export const createDropdownHandler = (registry: InlineRegistry): DropdownHandler => {
    const listeners = createListenerStore();

    const getAnchorField = (): Maybe<FieldHandle> => {
        const anchor = registry.dropdown?.anchor;
        if (anchor?.type === 'field') return anchor.field;
    };

    const dropdown: DropdownHandler = {
        listeners,
        attach: (layer) => registry.attachDropdown(layer),
        open: (payload) => {
            const attachedAnchor = registry.dropdown?.anchor;
            const visible = registry.dropdown?.getState().visible;
            const { autofocused } = payload;

            const didAnchorChange = !attachedAnchor || willDropdownAnchorChange(attachedAnchor, payload);

            /** Close if anchor changed or user clicked icon to toggle dropdown */
            const autoclose = visible && (didAnchorChange || !autofocused);
            if (autoclose) dropdown.close();

            if (didAnchorChange) {
                const form = payload.type === 'field' ? payload.field.getFormHandle() : undefined;
                const layer = form?.element;

                const close = () => dropdown.close();
                const maybeClose = onNextTick(() => !registry.dropdown?.focused && close());

                registry.attachDropdown(layer)?.open(payload);

                const scrollParent = form?.scrollParent;
                const scrollOptions = { capture: true, once: true, passive: true } as const;

                /** Register event listeners to auto-close dropdown on various UI interactions.
                 * - resize/scroll: close immediately on layout changes
                 * - focus: close on tab switching
                 * - blur: conditionally close only if dropdown lost focus */
                listeners.addListener(window, 'resize', close, { once: true, passive: true });
                listeners.addListener(window, 'scroll', close, scrollOptions);
                listeners.addListener(window, 'popstate', close);
                listeners.addListener(window, 'hashchange', close);
                listeners.addListener(window, 'beforeunload', close);
                listeners.addListener(window, 'focus', close);
                listeners.addListener(window, 'blur', () => maybeClose());
                listeners.addListener(window, 'mousedown', handleBackdrop(getAnchorField, close));
                listeners.addListener(scrollParent, 'scroll', close, scrollOptions);
            }
        },

        close: (target) => {
            const dropdown = registry.dropdown;
            const anchor = dropdown?.anchor;

            const activeAnchor = (() => {
                switch (target?.type) {
                    case 'field':
                        return anchor?.type === target.type && anchor.field.element === target.field.element;
                    case 'frame':
                        return (
                            anchor?.type === target.type &&
                            anchor.fieldId === target.fieldId &&
                            anchor.formId === target.formId
                        );
                }
            })();

            /* If a field is passed as a parameter, only close the
             * dropdown if it is currently attached to this element. */
            if (!target || activeAnchor) {
                listeners.removeAll();
                registry.dropdown?.close();
            }
        },

        destroy: () => {
            listeners.removeAll();
            registry.dropdown?.destroy();
        },

        sendMessage: (message) => registry.dropdown?.sendMessage(message),

        getState: async () => {
            const dropdown = registry.dropdown;
            const visible = dropdown?.getState().visible ?? false;
            const anchor = dropdown?.anchor;
            const focused = dropdown?.focused ?? false;

            return {
                visible,
                focused,
                attachedField: anchor
                    ? (() => {
                          switch (anchor.type) {
                              case 'field': {
                                  const { fieldId } = anchor.field;
                                  const { formId } = anchor.field.getFormHandle();
                                  return { fieldId, formId };
                              }
                              case 'frame': {
                                  const { fieldId, formId } = anchor;
                                  return { fieldId, formId };
                              }
                          }
                      })()
                    : undefined,
            };
        },

        settled: async () => true,
    };

    return dropdown;
};
