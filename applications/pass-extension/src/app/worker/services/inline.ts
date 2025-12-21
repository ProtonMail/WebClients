import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { withSender } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage, sendTabMessage } from 'proton-pass-extension/lib/message/send-message';
import type { FrameData, Frames } from 'proton-pass-extension/lib/utils/frames';
import { getTabFrames as getAllTabFrames, getFramePath } from 'proton-pass-extension/lib/utils/frames';
import type { FrameAttributes, FrameQueryResponse, FrameQueryResult } from 'proton-pass-extension/types/frames';
import type { Coords, DropdownStateDTO } from 'proton-pass-extension/types/inline';
import type { FrameQueryMessage, InlineDropdownStateMessage } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';
import type { FrameId, MaybeNull, TabId } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

type CurrentFrame = { frame: FrameData; frameAttributes: FrameAttributes; coords: Coords };

const FRAMES_FALLBACK = new Map([[0, { parent: null, frameId: 0, secure: null, origin: null }]]);

const getTabFrames: typeof getAllTabFrames = withContext(async (ctx, tabId, options) => {
    if (await ctx.service.autofill.iframeAutofillEnabled()) return getAllTabFrames(tabId, options);
    else return FRAMES_FALLBACK;
});

/**
 * Cross-frame autofill positioning service for nested iframe scenarios.
 *
 * Challenge: Field in Frame3→Frame2→Frame1→Frame0 needs dropdown positioned
 * relative to top-level viewport, requiring coordinate transformation through
 * the frame hierarchy.
 *
 * Flow: Field focus → INLINE_DROPDOWN_OPEN → getFrameCoords walks frame tree
 * accumulating offsets → stops at main frame parent → dropdown renders at
 * calculated absolute position in top-level document.
 */
export const createInlineService = () => {
    /** Frame position query: Gets coordinates of target frame relative to its parent.
     * Sends `FRAME_QUERY` message to parent frame to determine child iframe position.
     * Part of the coordinate calculation chain for absolute positioning. Frame query
     * will only resolve for an actual visible frame allowing early returns. */
    const queryFrame = async (
        tabId: TabId,
        data: FrameData,
        frameAttributes: FrameAttributes,
        maxRetries: number = 1
    ): Promise<FrameQueryResult> => {
        const frameId = data.frameId;
        const parentFrameId = data.parent ?? 0;

        try {
            return await browser.tabs.sendMessage<FrameQueryMessage, FrameQueryResult>(
                tabId,
                backgroundMessage({
                    type: WorkerMessageType.FRAME_QUERY,
                    payload: { type: 'position', frameId, frameAttributes },
                }),
                { frameId: parentFrameId }
            );
        } catch (err) {
            if (maxRetries === 0) throw err;

            /** Validate parent frame still exists and add small delay before
             * retry to handle asynchronous content-script initialization. */
            const validParent = !!(await browser.webNavigation.getFrame({ tabId, frameId: parentFrameId }).catch(noop));
            if (validParent) return wait(100).then(() => queryFrame(tabId, data, frameAttributes, maxRetries - 1));
            else throw err;
        }
    };

    /** Coordinate accumulator: walks up frame hierarchy calculating position relative
     * to top-level document. IMPORTANT: Stops when reaching a frame whose parent is main
     * frame (frameId 0), does NOT process main frame itself. This provides coordinates suitable
     * for positioning dropdowns in the top-level document viewport.
     *
     * Algorithm: Start with target frame → query parent for relative position → accumulate offsets →
     * move to parent → repeat until parent is main frame → return accumulated coordinates.
     * Returns `null` if any frame in the hierarchy is hidden, missing, or query fails. */
    const getFrameCoords = async (
        tabId: TabId,
        frameId: FrameId,
        { coords, frameAttributes }: Omit<FrameQueryResponse<'position'>, 'type'>,
        frames: Frames
    ): Promise<MaybeNull<CurrentFrame>> => {
        try {
            const start = frames.get(frameId);
            if (!(start && frameAttributes)) return null;

            const current: CurrentFrame = { frame: start, frameAttributes, coords };

            while (true) {
                const parentFrameId = current.frame.parent ?? 0;
                const result = await queryFrame(tabId, current.frame, current.frameAttributes);

                /** Hidden/missing frame detected */
                if (!(result.ok && result.type === 'position')) return null;

                /** Accumulate coordinate offsets from parent frame */
                current.coords.top += result.coords.top;
                current.coords.left += result.coords.left;

                /** Stop when parent is main frame - don't process main frame itself */
                if (parentFrameId === 0) break;

                const next = frames.get(parentFrameId);
                if (!next) return null; /** Parent frame missing from hierarchy */

                /** Move up to parent frame and continue */
                current.frame = next;
                current.frameAttributes = result.frameAttributes;
            }

            return current;
        } catch {
            return null;
        }
    };

    /** Validates frame hierarchy visibility for autofill */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FRAME_VISIBILITY,
        withSender(async ({ payload: frameAttributes }, tabId, frameId) => {
            const frames = await getTabFrames(tabId);
            const res = { type: 'position', coords: { top: 0, left: 0 }, frameAttributes } as const;
            const result = await getFrameCoords(tabId, frameId, res, frames);
            return { visible: result !== null };
        })
    );

    /** Forward inline dropdown state from top-level frame */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_STATE,
        withSender((message, tabId) =>
            browser.tabs.sendMessage<InlineDropdownStateMessage, DropdownStateDTO>(tabId, backgroundMessage(message), {
                frameId: 0,
            })
        )
    );

    /** Notify top-level frame to pre-attach inline UI */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_ATTACH,
        withSender(async (message, tabId) => {
            await browser.tabs.sendMessage(tabId, backgroundMessage(message), { frameId: 0 }).catch(noop);
            return true;
        })
    );

    /** Forward dropdown close request to top-level frame */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_CLOSE,
        withSender(async (message, tabId) => {
            await browser.tabs.sendMessage(tabId, backgroundMessage(message), { frameId: 0 }).catch(noop);
            return true;
        })
    );

    /** Forward dropdown closed event to all frames in target frame's hierarchy.
     * Ensures cross-frame listeners are properly cleaned up when dropdown closes. */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_CLOSED,
        withSender(async ({ payload }, tabId) => {
            const frames = await getTabFrames(tabId);
            const path = getFramePath(frames, payload.frameId);

            for (const frameId of path) {
                if (frameId === 0) continue;
                void browser.tabs
                    .sendMessage(
                        tabId,
                        backgroundMessage({
                            type: WorkerMessageType.INLINE_DROPDOWN_CLOSED,
                            payload: {
                                ...payload,
                                type: 'relay',
                                passive: frameId !== payload.frameId,
                            },
                        }),
                        { frameId }
                    )
                    .catch(noop);
            }

            return true;
        })
    );

    /** Dropdown positioning: Calculate absolute coordinates and open dropdown
     * 1. Calculate target field's absolute position in viewport
     * 2. Send positioning data to top-level frame
     * 3. Top-level frame renders dropdown at computed coordinates
     * - Frame sending this message must send out the current's frame
     * attributes to start the sequence. */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_TOGGLE,
        withSender(async ({ payload }, tabId, frameId) => {
            const frames = await getTabFrames(tabId);
            const result = await getFrameCoords(tabId, frameId, payload, frames);
            if (!result) return true;

            await browser.tabs
                .sendMessage(
                    tabId,
                    backgroundMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_TOGGLE,
                        payload: { ...payload, coords: result.coords },
                    }),
                    { frameId: 0 }
                )
                .catch(noop);

            return true;
        })
    );

    /** Notify all parent frames in hierarchy that dropdown opened.
     * Sets up cross-frame event listeners for scroll/focus auto-close. */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_OPENED,
        withSender(async ({ payload }, tabId) => {
            const frames = await getTabFrames(tabId);
            const path = getFramePath(frames, payload.frameId);

            for (const frameId of path) {
                if (frameId === 0) continue;
                const passive = frameId !== payload.frameId;
                void browser.tabs
                    .sendMessage(
                        tabId,
                        backgroundMessage({
                            type: WorkerMessageType.INLINE_DROPDOWN_OPENED,
                            payload: { ...payload, type: 'relay', passive },
                        }),
                        { frameId }
                    )
                    .catch(noop);
            }

            return true;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_ICON_ATTACHED,
        withSender(async ({ payload }, tabId, frameId) => {
            const frames = await browser.webNavigation.getAllFrames({ tabId });
            if (!frames) return true;

            for (const frame of frames) {
                if (frame.frameId === frameId) continue;
                void sendTabMessage(
                    backgroundMessage({
                        type: WorkerMessageType.INLINE_ICON_ATTACHED,
                        payload,
                    }),
                    { tabId, frameId: frame.frameId }
                ).catch(noop);
            }

            return true;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_ICON_SHIFT,
        withSender(async ({ payload }, tabId, frameId) => {
            if (frameId === 0) return { dx: 0 };

            const frame = await browser.webNavigation.getFrame({ frameId, tabId });
            if (!frame) return { dx: 0 };

            const res = await sendTabMessage(
                backgroundMessage({
                    type: WorkerMessageType.INLINE_ICON_SHIFT,
                    payload: { ...payload, type: 'relay', frameId },
                }),
                { tabId, frameId: frame.parentFrameId }
            );

            if (!res) throw new Error('No responder');
            return res;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FRAME_FIELD_LOCK,
        withSender(async ({ payload }, tabId) => {
            const res = await sendTabMessage(
                backgroundMessage({
                    type: WorkerMessageType.FRAME_FIELD_LOCK,
                    payload,
                }),
                { tabId, frameId: payload.frameId }
            );

            if (!res) throw new Error('No responder');
            return res;
        })
    );

    /** Sibling frame activation: when a deferred frame starts, notify siblings
     * to re-evaluate initialization. Prevents partial form detection across frames. */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FRAME_DEFERRED_INIT,
        withSender(async (_, tabId, parentFrameId) => {
            const frames = await getTabFrames(tabId);
            const current = frames.get(parentFrameId);
            if (!current || current.parent === null) return false;

            frames.forEach(({ parent, frameId }) => {
                if (parent === current.parent && frameId !== parentFrameId) {
                    void sendTabMessage(
                        backgroundMessage({
                            type: WorkerMessageType.FRAME_DEFERRED_INIT,
                        }),
                        { tabId, frameId }
                    ).catch(noop);
                }
            });

            return true;
        })
    );

    return { getTabFrames, queryFrame, getFrameCoords };
};

export type InlineService = ReturnType<typeof createInlineService>;
