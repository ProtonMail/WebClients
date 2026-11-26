import type { RequestForkData } from '@proton/pass/lib/auth/fork';
import { getStateKey, requestFork } from '@proton/pass/lib/auth/fork';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import browser from '@proton/pass/lib/globals/browser';
import { promptDismissed } from '@proton/pass/store/notifications/prompts/actions';
import type { PromptDescriptor } from '@proton/pass/store/notifications/prompts/definitions';
import { projectPrompt } from '@proton/pass/store/notifications/prompts/definitions';
import { selectPromptDismissal } from '@proton/pass/store/notifications/prompts/selectors';
import { selectHasTwoPasswordMode, selectIsSSO, selectUser } from '@proton/pass/store/selectors/user';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils';
import type { FrameId, TabId } from '@proton/pass/types/worker/runtime';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { withSender } from '../../../lib/message/message-broker';
import { backgroundMessage, sendTabMessage } from '../../../lib/message/send-message';
import type { FrameData, Frames } from '../../../lib/utils/frames';
import { getTabFrames as getAllTabFrames, getFramePath } from '../../../lib/utils/frames';
import { parseSender } from '../../../lib/utils/sender';
import type { FrameAttributes, FrameQueryResponse, FrameQueryResult } from '../../../types/frames';
import type { Coords, DropdownStateDTO } from '../../../types/inline';
import type { FrameQueryMessage, InlineDropdownStateMessage } from '../../../types/messages';
import { WorkerMessageType } from '../../../types/messages';
import config from '../../config';
import { InlineToastAction } from '../../content/constants.runtime';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context/inject';

type CurrentFrame = { frame: FrameData; frameAttributes: FrameAttributes; coords: Coords };

const FRAMES_FALLBACK = new Map([[0, { parent: null, frameId: 0, secure: null, origin: null }]]);

/** On-page offline-setup prompt trigger policy: one tab per browsing
 * session-cycle, the one with the first eligible top-frame navigation,
 * after a short delay so the prompt doesn't stampede page load.
 * `ownerTabId` is the multi-tab arbitration — ephemeral, in-memory,
 * SW-side: it dies with the SW (or on re-login), mirroring the
 * ledger's logout-wipe. */
const PROMPT_TRIGGER_DELAY = 3_000; /** ms */
const PROMPT_TRIGGER_URL = /^https?:\/\//;

/** Closes over the SW context root: registered once per SW lifetime,
 * so the closure IS the session cycle. */
const createPromptTrigger = () => {
    /** Tab that owns the prompt for this cycle: no other tab shows it */
    let ownerTabId: MaybeNull<TabId> = null;
    let settled = false;

    /** projection + arbitration: all SW-side, synchronous reads */
    const resolvePrompt = withContext<() => MaybeNull<PromptDescriptor>>((ctx) => {
        if (!ctx.getState().authorized) return null;

        const client = {
            offlineComponents: ctx.authStore.hasOfflineComponents(),
            online: ctx.service.connectivity.online,
        };

        return projectPrompt(
            'offline-onpage',
            selectPromptDismissal('offline-onpage')(ctx.service.store.getState()),
            client,
            getEpoch()
        );
    });

    /** Wait out page-load contention (or the content script restart after
     * a tab switch) before opening the toast in the top frame. A newer
     * offer replaces a pending one, and the prompt is resolved again
     * when the delay ends: it may have been dismissed in the meantime. */
    let pendingShow: Maybe<ReturnType<typeof setTimeout>>;

    const show = (tabId: TabId) => {
        const prompt = settled ? null : resolvePrompt();
        if (!prompt) return logger.debug(`[PromptTrigger] prompt no longer eligible in tab ${tabId}`);

        browser.tabs
            .sendMessage(
                tabId,
                backgroundMessage({
                    type: WorkerMessageType.INLINE_TOAST_OPEN,
                    payload: { action: InlineToastAction.OFFLINE_SETUP, data: prompt },
                }),
                { frameId: 0 }
            )
            .then(() => logger.debug(`[PromptTrigger] prompt shown in tab ${tabId}`))
            .catch((err) => logger.warn(`[PromptTrigger] toast open failed in tab ${tabId}`, err));
    };

    const offer = (tabId: TabId) => {
        if (!resolvePrompt()) return;

        ownerTabId = tabId;
        clearTimeout(pendingShow);
        pendingShow = setTimeout(() => show(tabId), PROMPT_TRIGGER_DELAY);
        logger.debug(`[PromptTrigger] showing prompt in tab ${tabId} in ${PROMPT_TRIGGER_DELAY}ms`);
    };

    /** Completed top-level navigations of a visible tab: a hidden tab cannot
     * display the toast. The owner tab shows the prompt again after each
     * navigation, as the page load destroys its toast. */
    const onUpdated = (
        tabId: TabId,
        changeInfo: { status?: string },
        tab: { id?: number; url?: string; active?: boolean }
    ) => {
        if (settled || changeInfo.status !== 'complete' || !tabId || !tab?.active || !tab.url) return;
        if (!PROMPT_TRIGGER_URL.test(tab.url)) return;
        if (ownerTabId !== null && ownerTabId !== tabId) return;

        offer(tabId);
    };

    /** A hidden tab destroys its toast without recording a dismissal:
     * show it again when the owner tab comes back, until the prompt is
     * dismissed (the projection returns `null`) or its CTA was used. */
    const onActivated = ({ tabId }: { tabId: TabId }) => {
        if (settled || tabId !== ownerTabId) return;
        offer(tabId);
    };

    /** A closed owner tab frees the prompt for the next navigation */
    const onRemoved = (tabId: TabId) => {
        if (tabId === ownerTabId) ownerTabId = null;
    };

    const settle = () => {
        settled = true;
        clearTimeout(pendingShow);
    };

    return { onUpdated, onActivated, onRemoved, settle };
};

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
    const promptTrigger = createPromptTrigger();

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

    WorkerMessageBroker.registerMessage(WorkerMessageType.INLINE_TOAST_OPEN, async ({ payload }, sender) => {
        if (payload.action !== InlineToastAction.AUTOSAVE) throw new Error('Unallowed inline request');

        /** Only sub-frame autosaves go through here. The toast opens in
         * the top frame, so read the iframe's URL here (while the sender is still the
         * iframe) and forward it, so the login is saved for the iframe's site. */
        const { tabId, href } = await parseSender(sender);
        payload.data.iframeUrl = href;

        await browser.tabs
            .sendMessage(
                tabId,
                backgroundMessage({
                    type: WorkerMessageType.INLINE_TOAST_OPEN,
                    payload,
                }),
                { frameId: 0 }
            )
            .catch(noop);

        return true;
    });

    /** CTA of the on-page offline-setup prompt. Users who must re-authenticate
     * via account go there directly (same fork as the in-app banner). Others
     * open the settings page (regular tab) with the offline-setup intent: the
     * `Offline` settings panel picks the query param up on mount and
     * auto-triggers the password-confirmation flow. */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.OFFLINE_SETUP_OPEN,
        withContext(async (ctx) => {
            promptTrigger.settle();

            const state = ctx.service.store.getState();
            const needsAccount = selectIsSSO(state) || selectHasTwoPasswordMode(state);

            if (needsAccount && !ctx.authStore.hasOfflinePassword()) {
                const user = selectUser(state);
                const reauth = { type: ReauthAction.OFFLINE_SETUP } as const;
                const data: RequestForkData = { type: 'reauth', userID: user?.ID, reauth };

                const { url, state: forkState } = requestFork({
                    app: APPS.PROTONPASSBROWSEREXTENSION,
                    email: user?.Email,
                    host: config.SSO_URL,
                    promptBypass: 'none',
                    promptType: 'offline',
                });

                await browser.storage.session.set({ [getStateKey(forkState)]: JSON.stringify(data) });
                await browser.tabs.create({ url });
                return true;
            }

            const settingsUrl = `${browser.runtime.getURL('/settings.html')}#/general?offline=setup`;
            await browser.tabs.create({ url: settingsUrl });
            return true;
        })
    );

    /** Ledger writer for on-page prompt dismissals */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PROMPT_DISMISS,
        withContext((ctx, { payload }) => {
            ctx.service.store.dispatch(promptDismissed(payload.id));
            if (payload.id === 'offline-onpage') promptTrigger.settle();
            return true;
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

    /** On-page offline-setup prompt: once-per-session-cycle trigger on
     * eligible top-frame navigations (see `createPromptTrigger`) */
    browser.tabs.onUpdated.addListener(promptTrigger.onUpdated);
    browser.tabs.onActivated.addListener(promptTrigger.onActivated);
    browser.tabs.onRemoved.addListener(promptTrigger.onRemoved);

    return { getTabFrames, queryFrame, getFrameCoords };
};

export type InlineService = ReturnType<typeof createInlineService>;
