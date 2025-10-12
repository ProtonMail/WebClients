import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { createInlineFrameListeners } from 'proton-pass-extension/app/content/services/inline/inline.listeners';
import { getFrameAttributes } from 'proton-pass-extension/app/content/utils/frame';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';
import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { createAsyncQueue } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

export const createInlineRelay = ({ controller }: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in sub-frames */
    if (isMainFrame()) throw new Error('InlineRelay should only be created in sub-frames');

    /** NOTE: an async queue is used to process field events in a predictable
     * order. As some events are processed asynchronously via messaging, this
     * ensures the the top and sub-frame states remain in sync */
    const queue = createAsyncQueue();
    const { channel } = controller;

    const activeListeners = createListenerStore();
    const inlineListeners = createInlineFrameListeners(channel);

    const dropdown: AbstractInlineService['dropdown'] = {
        attach: () => {
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.INLINE_DROPDOWN_ATTACH,
                })
            ).catch(noop);
        },

        open: withContext((ctx, req) => {
            if (req.type === 'frame') return;

            const { fieldId } = req.field;
            const formId = req.field.getFormHandle().formId;

            const origin = (() => {
                /** IFrames with `about:blank` src inherit the origin of the parent document.
                 * TODO: Consider using the parent frame's resolved origin for these cases. */
                const url = ctx?.getExtensionContext()?.url;
                if (url) return req.action === DropdownAction.AUTOFILL_CC ? resolveDomain(url) : resolveSubdomain(url);
            })();

            if (!origin) return;

            void queue.push(async () => {
                const anchor = req.field.getAnchor().element;
                const styles = createStyleParser(anchor);
                const { left, top } = anchor.getBoundingClientRect();
                const { value: height } = getComputedHeight(styles, 'outer');
                const { value: width } = getComputedWidth(styles, 'outer');

                await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_OPEN,
                        payload: {
                            type: 'request',
                            action: req.action,
                            autofocused: req.autofocused,
                            frameAttributes: getFrameAttributes(),
                            field: { fieldId, formId },
                            origin,
                            coords: {
                                top: top + height,
                                left: left + width - DROPDOWN_WIDTH,
                            },
                        },
                    })
                );
            });
        }),

        close: (target) => {
            void queue.push(async () => {
                activeListeners.removeAll();
                await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_CLOSE,
                        payload: {
                            field: (() => {
                                if (target && target?.type === 'field') {
                                    const { fieldId } = target.field;
                                    const formId = target.field.getFormHandle().formId;
                                    return { fieldId, formId };
                                }
                            })(),
                        },
                    })
                );
            });
        },

        destroy: noop,
        sendMessage: noop,
        getState: async () => {
            /** In the `InlineRelayService` we have no way of getting the dropdown's
             * state to decide if we detach the field icon or not. As such relay the
             * blur event via messaging and let the top-frame decide */
            const res = await queue.push(() =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_STATE,
                    })
                )
            );

            if (res?.type === 'success') return res;
            else return { visible: false };
        },
    };

    const notification: AbstractInlineService['notification'] = {
        attach: noop,
        open: noop,
        close: noop,
        destroy: noop,
    };

    const onInlineDropdownClosed: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSED> = withContext(
        (ctx, { payload }) => {
            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            activeListeners.removeAll();
            if (payload.refocus) field?.focus();
            else if (field?.element !== document.activeElement) field?.detachIcon();
        }
    );

    const onInlineDropdownOpened: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPENED> = withContext(
        (ctx, { payload }) => {
            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            if (!(form && field)) return;

            const close = () => dropdown.close({ type: 'field', field });

            const handleBlur = () =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_FRAME_BLUR,
                        payload: { formId, fieldId },
                    })
                ).catch(noop);

            /** Intercept scroll events in sub-frames. It is too costly to try to reposition
             * any injected UI elements in the top-frame via messaging. */
            const scrollParent = form.scrollParent;
            const scrollOptions = { capture: true, once: true, passive: true } as const;

            activeListeners.addListener(window, 'scroll', close, scrollOptions);
            activeListeners.addListener(scrollParent, 'scroll', close, scrollOptions);
            activeListeners.addListener(window, 'blur', handleBlur, { once: true });

            /** Intercept backdrop clicks in sub-frames. The backdrop click
             * handler in the top-frame will not catch clicks in sub-frames.
             * FIXME: this should be factorized */
            activeListeners.addListener(window, 'mousedown', (event: Event) => {
                const target = event.target as MaybeNull<HTMLElement>;
                const rootNode = field.element.getRootNode();

                const host = isShadowRoot(rootNode) ? rootNode.host : null;
                const excludes = [field.icon?.element, field.element, host].filter(truthy);

                if (!target || !excludes.includes(target)) close();
            });
        }
    );

    return {
        init: () => {
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPENED, onInlineDropdownOpened);
            inlineListeners.init();
        },
        destroy: () => {
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPENED, onInlineDropdownOpened);
            activeListeners.removeAll();
            inlineListeners.destroy();
            queue.cancel();
        },

        setTheme: noop,
        sync: noop,

        dropdown,
        notification,
    };
};
