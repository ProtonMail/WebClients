import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { getFrameAttributes } from 'proton-pass-extension/app/content/utils/frame';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { MaybeNull } from '@proton/pass/types';
import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { createAsyncQueue } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { resolveDomain } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

export const createInlineRelay = ({ controller }: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: an async queue is used to process field events in a predictable
     * order. As some events are processed asynchronously via messaging, this
     * ensures the the top and sub-frame states remain in sync */
    const queue = createAsyncQueue();
    const activeListeners = createListenerStore();
    const { transport } = controller;

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

            /** iframe origin may be empty for the case */
            const url = ctx?.getExtensionContext()?.url;
            const origin = (url ? resolveDomain(url) : null) ?? '';

            void queue.push(async () => {
                const anchor = req.field.getBoxElement();
                const { fieldId } = req.field;
                const formId = req.field.getFormHandle().formId;

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

                const handleClose = () => dropdown.close({ type: 'field', field: req.field });

                activeListeners.addListener(window, 'resize', handleClose);
                activeListeners.addListener(document, 'scroll', handleClose, { capture: true });

                /** Intercept backdrop clicks in sub-frames. The backdrop click
                 * handler in the top-frame will not catch clicks in sub-frames */
                activeListeners.addListener(window, 'mousedown', (event: Event) => {
                    const target = event.target as MaybeNull<HTMLElement>;
                    if (!target || !(req.field.icon?.element === target)) handleClose();
                });
            });
        }),

        close: (target) => {
            activeListeners.removeAll();
            void queue.push(async () => {
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

    return {
        init: () => {
            transport.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },
        destroy: () => {
            transport.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },

        setTheme: noop,
        sync: noop,

        dropdown,
        notification,
    };
};
