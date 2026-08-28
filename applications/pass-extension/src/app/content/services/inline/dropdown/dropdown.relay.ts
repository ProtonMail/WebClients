import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { maxAgeMemoize } from '@proton/pass/utils/fp/memo';
import { createAsyncQueue } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

import { contentScriptMessage, sendMessage } from '../../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../../types/messages';
import { DROPDOWN_WIDTH } from '../../../constants.static';
import { withContext } from '../../../context/context';
import { getAutofillPageTelemetryDimensions } from '../../../utils/autofill-telemetry';
import { getFrameAttributes } from '../../../utils/frame';
import type { DropdownHandler } from './dropdown.abstract';
import { resolveOriginScope } from './dropdown.utils';

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

        toggle: withContext((ctx, req) => {
            if (req.type === 'frame') return;

            const { fieldId, frameId, formId } = req.field;
            const url = ctx?.getExtensionContext()?.frameUrl;
            const origin = url ? resolveOriginScope(req, url) : null;

            if (!origin) return;

            void queue.push(async () => {
                const anchor = req.field.getAnchor().element;
                const styles = createStyleParser(anchor);
                const { left, top } = anchor.getBoundingClientRect();
                const { value: height } = getComputedHeight(styles, 'outer');
                const { value: width } = getComputedWidth(styles, 'outer');

                await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_TOGGLE,
                        payload: {
                            type: 'initial',
                            action: req.action,
                            autofilled: req.autofilled,
                            autofocused: req.autofocused,
                            frameAttributes: getFrameAttributes(),
                            field: { fieldId, formId, frameId },
                            origin,
                            telemetry: getAutofillPageTelemetryDimensions(req.field.element),
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
                                    const { fieldId, frameId, formId } = target.field;
                                    return { fieldId, formId, frameId };
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

        getState: maxAgeMemoize(
            async () => {
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
            { maxAge: 1 }
        ),
    };

    return dropdown;
};
