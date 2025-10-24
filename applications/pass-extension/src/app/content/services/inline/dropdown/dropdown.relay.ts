import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { getFrameAttributes } from 'proton-pass-extension/app/content/utils/frame';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { createAsyncQueue } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

import type { DropdownHandler } from './dropdown.abstract';

export const createDropdownRelayHandler = (): DropdownHandler => {
    /** Async queue ensures predictable event processing order for cross-frame messaging.
     * Prevents race conditions between sub-frame field events and top-frame dropdown state. */
    const queue = createAsyncQueue();
    const listeners = createListenerStore();

    const dropdown: DropdownHandler = {
        listeners,

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
                /** IFrames with `about:blank` inherit parent document origin.
                 * TODO: Use parent frame's resolved origin for these edge cases. */
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
                            type: 'initial',
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
                listeners.removeAll();
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

        destroy: () => {
            queue.cancel();
            listeners.removeAll();
        },

        sendMessage: noop,

        getState: async () => {
            /** Sub-frames cannot access dropdown state directly, so relay state requests
             * to top-frame for icon and dropdown management decisions in sub-frames. */
            const res = await queue.push(() =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_STATE,
                    })
                )
            );

            if (res?.type === 'success') return res;
            else return { visible: false, focused: false };
        },
    };

    return dropdown;
};
