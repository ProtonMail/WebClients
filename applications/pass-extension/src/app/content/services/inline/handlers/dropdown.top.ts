import type {
    DropdownAnchor,
    DropdownRequest,
} from 'proton-pass-extension/app/content/services/iframes/dropdown/dropdown.app';
import type { IFrameRegistry } from 'proton-pass-extension/app/content/services/iframes/registry';
import type { DropdownHandler } from 'proton-pass-extension/app/content/services/inline/handlers/dropdown.abstract';

import { createListenerStore } from '@proton/pass/utils/listener/factory';

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

export const createDropdownTopHandler = (registry: IFrameRegistry): DropdownHandler => {
    const listeners = createListenerStore();

    const dropdown: DropdownHandler = {
        listeners,
        attach: (layer) => registry.attachDropdown(layer),
        open: (payload) => {
            const attachedAnchor = registry.dropdown?.anchor;
            const visible = registry.dropdown?.getState().visible;
            const { autofocused } = payload;

            const didAnchorChange = !attachedAnchor || willDropdownAnchorChange(attachedAnchor, payload);
            const autoclose = visible && (didAnchorChange || !autofocused);

            if (autoclose) dropdown.close();

            if (didAnchorChange) {
                const form = payload.type === 'field' ? payload.field.getFormHandle() : undefined;
                const layer = form?.element;
                const close = () => dropdown.close(payload);

                registry.attachDropdown(layer)?.open(payload);

                const scrollParent = form?.scrollParent;
                const scrollOptions = { capture: true, once: true, passive: true } as const;

                listeners.addListener(window, 'resize', close, { once: true, passive: true });
                listeners.addListener(window, 'scroll', close, scrollOptions);
                listeners.addListener(scrollParent, 'scroll', close, scrollOptions);
            }
        },

        close: (target) => {
            listeners.removeAll();
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
            if (target && !activeAnchor) return;
            registry.dropdown?.close();
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

            return {
                visible,
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
