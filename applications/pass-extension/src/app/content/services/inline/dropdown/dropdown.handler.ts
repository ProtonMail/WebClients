import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineRegistry } from 'proton-pass-extension/app/content/services/inline/inline.registry';

import type { Maybe, MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

import type { DropdownHandler } from './dropdown.abstract';
import {
    matchesDropdownAnchor,
    onBackdropClick,
    onFocusChangeFactory,
    validateDropdownRequest,
} from './dropdown.utils';

type State = { ctrl: MaybeNull<AbortController> };

export const createDropdownHandler = (registry: InlineRegistry): DropdownHandler => {
    const listeners = createListenerStore();
    const state: State = { ctrl: null };

    const getAnchorField = (): Maybe<FieldHandle> => {
        const anchor = registry.dropdown?.anchor;
        if (anchor?.type === 'field') return anchor.field;
    };

    const dropdown: DropdownHandler = {
        listeners,
        attach: (layer) => registry.attachDropdown(layer),
        toggle: async (request) => {
            state.ctrl?.abort();
            state.ctrl = null;

            const visible = registry.dropdown?.getState().visible;
            const valid = await validateDropdownRequest(request, registry.dropdown?.anchor);

            if (visible) dropdown.close();

            if (valid) {
                const ctrl = new AbortController();
                state.ctrl = ctrl;

                const field = request.type === 'field' ? request.field : undefined;
                const form = field?.getFormHandle();
                const layer = form?.element;

                const app = registry.attachDropdown(layer);
                if (!app) return;

                app.open(request, ctrl);

                const close = () => dropdown.close(request);
                const onFocusChange = onFocusChangeFactory(dropdown, request);
                const onKeyDown = (evt: KeyboardEvent) => evt.key === 'Escape' && close();

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
                listeners.addListener(window, 'focus', onFocusChange);
                listeners.addListener(window, 'blur', onFocusChange);
                listeners.addListener(window, 'mousedown', onBackdropClick(getAnchorField, close));
                listeners.addListener(scrollParent, 'scroll', close, scrollOptions);
                listeners.addListener(document, 'keydown', onKeyDown);

                /** Dropdown app may be closed from within its internal
                 * lifecycle. In such cases clean-up listeners. */
                listeners.addSubscriber(
                    app.subscribe((evt) => {
                        switch (evt.type) {
                            case 'close':
                                listeners.removeAll();
                                break;
                            case 'abort':
                                if (matchesDropdownAnchor(registry.dropdown?.anchor, request)) {
                                    listeners.removeAll();
                                }
                                break;
                        }
                    })
                );
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

            /** Only close dropdown if no target specified OR target matches current
             * anchor. Prevents closing dropdown when triggered fom unrelated field.
             * Sub-frame close requests are asynchronous: top-frame dropdown may have
             * already been closed and re-attached to another field. */
            if (!target || activeAnchor) {
                listeners.removeAll();
                state.ctrl?.abort();
                state.ctrl = null;
                registry.dropdown?.close();
            }
        },

        destroy: () => {
            listeners.removeAll();
            state.ctrl?.abort();
            state.ctrl = null;
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
                                  const { fieldId, formId, frameId } = anchor.field;
                                  return { fieldId, formId, frameId };
                              }
                              case 'frame': {
                                  const { fieldId, formId, frameId } = anchor;
                                  return { fieldId, formId, frameId };
                              }
                          }
                      })()
                    : undefined,
            };
        },
    };

    return dropdown;
};
