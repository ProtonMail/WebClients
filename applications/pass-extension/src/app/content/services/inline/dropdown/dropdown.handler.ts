import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineRegistry } from 'proton-pass-extension/app/content/services/inline/inline.registry';

import type { Maybe } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

import type { DropdownHandler } from './dropdown.abstract';
import { handleAutoClose, handleBackdrop, willDropdownAnchorChange } from './dropdown.utils';

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

            /** Auto-close conditions: anchor changed OR user clicked icon (autofocused=false) */
            const autoclose = visible && (didAnchorChange || !autofocused);
            if (autoclose) dropdown.close();

            if (didAnchorChange) {
                const form = payload.type === 'field' ? payload.field.getFormHandle() : undefined;
                const layer = form?.element;

                const close = () => dropdown.close();
                const autoclose = handleAutoClose(dropdown);

                registry.attachDropdown(layer)?.open(payload);

                const scrollParent = form?.scrollParent;
                const scrollOptions = { capture: true, once: true, passive: true } as const;

                /** Auto-close listeners for dropdown lifecycle:
                 * - resize/scroll: immediate close on layout changes
                 * - popstate/hashchange/beforeunload: close on navigation
                 * - focus/blur: conditional close (see: `dropdown.utils.ts`) */
                listeners.addListener(window, 'resize', close, { once: true, passive: true });
                listeners.addListener(window, 'scroll', close, scrollOptions);
                listeners.addListener(window, 'popstate', close);
                listeners.addListener(window, 'hashchange', close);
                listeners.addListener(window, 'beforeunload', close);
                listeners.addListener(window, 'focus', autoclose);
                listeners.addListener(window, 'blur', autoclose);
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

            /** Only close dropdown if no target specified OR target matches current anchor.
             * Prevents closing dropdown when triggered by unrelated field events. */
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
    };

    return dropdown;
};
