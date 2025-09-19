import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import type { FrameAttributes, FrameQueryResponse, FrameQueryResult } from 'proton-pass-extension/types/frames';
import type { DropdownStateDTO } from 'proton-pass-extension/types/inline';
import type { FrameQueryMessage, InlineDropdownStateMessage } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Coords, MaybeNull, TabId } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type FrameID = number;
type FrameData = { parent: MaybeNull<FrameID>; frameId: number };
type Frames = Partial<Record<FrameID, FrameData>>;
type CurrentFrame = { frame: FrameData; frameAttributes: FrameAttributes; coords: Coords };

const withSender =
    <T, R>(fn: (message: T, tabId: number, frameId: number) => R) =>
    (message: T, sender: Runtime.MessageSender) => {
        if (!(sender.tab?.id && sender.frameId !== undefined)) throw new Error();
        return fn(message, sender.tab.id, sender.frameId);
    };

export const createInlineService = () => {
    /** Frame hierarchy tracker: Creates parent-child relationship map for all frames in a tab */
    const getTabFrames = async (tabId: TabId): Promise<Frames> =>
        browser.webNavigation.getAllFrames({ tabId }).then((frames) => {
            return (frames ?? []).reduce<Frames>((res, frame) => {
                const { parentFrameId, frameId } = frame;

                /** Main frame (frameId 0) or orphaned frame */
                if (frameId === 0 || parentFrameId === -1) {
                    res[frameId] = { parent: null, frameId };
                    return res;
                }

                const parent = res[parentFrameId];
                if (!parent) return res;

                res[frameId] = { parent: parentFrameId, frameId };

                return res;
            }, {});
        });

    /** Frame position query: Gets coordinates of target frame relative to its parent.
     * Sends `FRAME_QUERY` message to parent frame to determine child iframe position.
     * Part of the coordinate calculation chain for absolute positioning. */
    const queryFrame = async (
        tabId: TabId,
        data: FrameData,
        attributes: FrameAttributes
    ): Promise<FrameQueryResult> => {
        const { frameId, parent: parentFrameId } = data;

        return browser.tabs.sendMessage<FrameQueryMessage, FrameQueryResult>(
            tabId,
            backgroundMessage({
                type: WorkerMessageType.FRAME_QUERY,
                payload: { frameId, parentFrameId, attributes },
            }),
            { frameId: parentFrameId ?? 0 }
        );
    };

    /** Absolute coordinate calculation: Traverses frame hierarchy to get top-level
     * position. Walks up the frame tree accumulating coordinate offsets at each level.
     * Essential for positioning UI overlays that need absolute positioning relative to
     * the main document viewport. Returns null if any frame in the hierarchy is hidden */
    const getFrameCoords = async (
        tabId: TabId,
        frameId: FrameID,
        { coords, frameAttributes }: FrameQueryResponse
    ): Promise<MaybeNull<CurrentFrame>> => {
        try {
            const frames = await getTabFrames(tabId);
            if (!(frames[frameId] && frameAttributes)) return null;

            const current: CurrentFrame = { frame: frames[frameId]!, frameAttributes, coords };

            while (true) {
                const frameId = current.frame.parent ?? 0;
                const result = await queryFrame(tabId, current.frame, current.frameAttributes);

                /** Hidden/missing frame detected */
                if (!result.ok) return null;

                current.coords.top += result.coords.top;
                current.coords.left += result.coords.left;

                if (frameId === 0) break;

                const next = frames[frameId];
                if (!next) return null;

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
        WorkerMessageType.FRAME_CHECK,
        withSender(async ({ payload: frameAttributes }, tabId, frameId) => {
            const result = await getFrameCoords(tabId, frameId, { coords: { top: 0, left: 0 }, frameAttributes });
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

    /** Forward dropdown closed event to sub-frame */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_CLOSED,
        withSender(async (message, tabId) => {
            await browser.tabs
                .sendMessage(tabId, backgroundMessage(message), { frameId: message.payload.fieldFrameId })
                .catch(noop);

            return true;
        })
    );

    /** Dropdown positioning: Calculate absolute coordinates and open dropdown
     * 1. Calculate target field's absolute position in viewport
     * 2. Send positioning data to top-level frame
     * 3. Top-level frame renders dropdown at computed coordinates */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.INLINE_DROPDOWN_OPEN,
        withSender(async ({ payload }, tabId, frameId) => {
            const result = await getFrameCoords(tabId, frameId, payload);
            if (!result) return true;

            await browser.tabs
                .sendMessage(
                    tabId,
                    backgroundMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_OPEN,
                        payload: {
                            ...payload,
                            type: 'result',
                            coords: result.coords,
                            frameId: result.frame.frameId,
                            fieldFrameId: frameId,
                            frameAttributes: result.frameAttributes,
                        },
                    }),
                    { frameId: 0 }
                )
                .catch(noop);

            return true;
        })
    );

    return {};
};

export type InlineService = ReturnType<typeof createInlineService>;
