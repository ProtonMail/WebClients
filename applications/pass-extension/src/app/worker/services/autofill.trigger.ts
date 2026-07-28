import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage, sendTabMessage } from 'proton-pass-extension/lib/message/send-message';
import { getFramesTopFirst, getTabFrames } from 'proton-pass-extension/lib/utils/frames';
import type { AutofillTriggerResult } from 'proton-pass-extension/types/autofill';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { clientLocked } from '@proton/pass/lib/client';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils/index';
import type { FrameId, TabId } from '@proton/pass/types/worker/runtime';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

/** Opens a transient toast in the tab's top-frame. Content-scripts cannot open a
 * `TOAST` themselves — the worker's inbound `INLINE_NOTIFICATION_OPEN` handler only
 * accepts `AUTOSAVE` — so keyboard-shortcut feedback is emitted worker-side. */
const notifyTab = (tabId: TabId, message: string) =>
    sendTabMessage(
        backgroundMessage({
            type: WorkerMessageType.INLINE_NOTIFICATION_OPEN,
            payload: { action: NotificationAction.TOAST, message },
        }),
        { tabId, frameId: 0 }
    ).catch(noop);

/** Frames without a content-script reject `sendMessage` ("Could not establish
 * connection") rather than resolving : swallow and let the walk continue. */
const queryFrameTrigger = (tabId: TabId, frameId: FrameId): Promise<Maybe<AutofillTriggerResult>> =>
    sendTabMessage(backgroundMessage({ type: WorkerMessageType.AUTOFILL_TRIGGER }), { tabId, frameId }).catch(noop);

/** Frames to walk, top-frame first. Sub-frames are only considered when iframe
 * autofill is enabled — with the killswitch on they have no content-script, so
 * querying them would only burn round-trips. */
const resolveFrameIds = withContext<(tabId: TabId) => Promise<FrameId[]>>(async (ctx, tabId) => {
    try {
        if (!(await ctx.service.autofill.iframeAutofillEnabled())) return [0];
        return getFramesTopFirst(await getTabFrames(tabId));
    } catch {
        /** Frame resolution can fail (eg: tab closed mid-flight) : fall back to
         * the top-frame rather than dropping the trigger altogether. */
        return [0];
    }
});

/** Walks the tab's frames top-frame first and early-exits on the first frame owning
 * an autofillable login field (see `AutofillService::onAutofillTrigger`). */
const queryAutofillTrigger = async (tabId: TabId): Promise<MaybeNull<FrameId>> => {
    const frameIds = await resolveFrameIds(tabId);

    for (const frameId of frameIds) {
        const res = await queryFrameTrigger(tabId, frameId);
        if (res?.matched) return frameId;
    }

    return null;
};

/** Keyboard-shortcut entry point (see `worker/listeners/commands.ts`). Resolves the
 * frame answering the trigger, then hands keyboard focus to the inline dropdown —
 * which always lives in the top-frame, even when the matched field sits in a
 * sub-frame. Surfaces a toast when nothing could be offered, so the shortcut is never
 * a silent no-op. NOTE: a locked client with a login field is intentionally NOT
 * toasted — the dropdown opens with its inline unlock UI, which is more actionable. */
export const triggerTabAutofill = withContext<(tabId: TabId) => Promise<boolean>>(async (ctx, tabId) => {
    try {
        const frameId = await queryAutofillTrigger(tabId);

        if (frameId === null) {
            const { status, authorized } = ctx.getState();

            const message = (() => {
                if (clientLocked(status)) return c('Warning').t`Unlock ${PASS_APP_NAME} to autofill`;
                if (!authorized) return c('Warning').t`Sign in to ${PASS_APP_NAME} to autofill`;
                return c('Warning').t`No login form found on this page`;
            })();

            await notifyTab(tabId, message);
            return false;
        }

        /** The trigger reply is synchronous, so the dropdown may still be opening :
         * the top-frame handler polls until it is visible before acquiring focus. */
        await sendTabMessage(backgroundMessage({ type: WorkerMessageType.INLINE_DROPDOWN_FOCUS }), {
            tabId,
            frameId: 0,
        }).catch(noop);

        return true;
    } catch {
        return false;
    }
});
