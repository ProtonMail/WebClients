import { backgroundMessage, sendTabMessage } from 'proton-pass-extension/lib/message/send-message';
import type { FrameAttributes } from 'proton-pass-extension/types/frames';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { WebNavigation } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { FrameId, MaybeNull, TabId } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { resolveDomain } from '@proton/pass/utils/url/utils';

export type FrameID = number;
export type FrameData = { parent: MaybeNull<FrameID>; frameId: number; origin: MaybeNull<string> };
export type Frames = Map<FrameID, FrameData>;
export type FrameMapper<R> = (frame: WebNavigation.GetAllFramesCallbackDetailsItemType) => R;

/** Frame hierarchy tracker: Creates parent-child relationship map
 * for all frames in a tab. Used by `getFrameCoords` to walk up the
 * frame tree. Excludes orphaned frames (missing parents). */
export const getTabFrames = async (tabId: TabId, options?: { parseOrigin: boolean }): Promise<Frames> =>
    browser.webNavigation.getAllFrames({ tabId }).then((frames) => {
        return (frames ?? []).reduce<Frames>((res, frame) => {
            const { parentFrameId, frameId, url } = frame;
            const origin = options?.parseOrigin ? resolveDomain(parseUrl(url)) : null;

            /** Main frame (frameId 0) or orphaned frame */
            if (frameId === 0 || parentFrameId === -1) {
                res.set(frameId, { parent: null, frameId, origin });
                return res;
            }

            const parent = res.get(parentFrameId);
            if (!parent) return res;

            res.set(frameId, { parent: parentFrameId, frameId, origin });

            return res;
        }, new Map());
    });

/** Returns the path from target frame to root frame (leaf to root order) */
export const getFramePath = (frames: Frames, frameId: FrameID): FrameID[] => {
    if (frameId === 0) return [0];

    const path = [];
    let current = frames.get(frameId);

    while (current) {
        path.push(current.frameId);
        if (current.parent !== null) current = frames.get(current.parent);
        else current = undefined;
    }

    return path;
};

/** Validates that all frames in the path from target frame to root contain
 * only allowed origins. Prevents cross-origin injection attacks by ensuring
 * no malicious intermediate frames in the ancestry chain. */
export const validateFramePath = (frames: Frames, frameID: FrameID, trustedOrigins: Set<string>): boolean => {
    const path = getFramePath(frames, frameID);
    return path.every((pathFrameID) => {
        const frameOrigin = frames.get(pathFrameID)?.origin;
        if (!frameOrigin) return false;
        return trustedOrigins.has(frameOrigin);
    });
};

export type AutofillableFrame = { frame: FrameData; crossOrigin: boolean; tabId: TabId };
export type AutofillableFrames = Map<FrameID, AutofillableFrame>;

/** Determines which frames are safe to autofill based on origin validation.
 * - Validates complete frame ancestry to prevent malicious intermediate frames
 * - Only autofills frames matching the trigger origin or top-level origin
 * - Rejects any frame with untrusted origins in its ancestry chain */
export const getAutofillableFrames = async (
    tabId: TabId,
    frameOrigin: string,
    originFrameID: FrameID
): Promise<AutofillableFrames> => {
    const frames = await getTabFrames(tabId, { parseOrigin: true });
    const trustedOrigins = new Set<string>();
    const autofillableOrigins = new Set<string>();

    /** Always trust and autofill the origin that triggered autofill */
    trustedOrigins.add(frameOrigin);
    autofillableOrigins.add(frameOrigin);

    /** Autofill policy: only trigger origin + top-level domain */
    if (originFrameID !== 0) {
        const topFrame = frames.get(0);
        if (topFrame?.origin) autofillableOrigins.add(topFrame.origin);
    }

    /** Build trusted ancestry chain by walking up to root frame */
    const originFrame = frames.get(originFrameID);
    let current = originFrame;

    while (current && current.parent !== null) {
        const parent = frames.get(current.parent);
        if (!parent?.origin) break;
        trustedOrigins.add(parent.origin);
        current = parent;
    }

    const autofillableFrames: AutofillableFrames = new Map();

    for (const [frameId, frame] of frames) {
        if (!frame.origin) continue;

        /** 1. Frame origin must be autofillable (policy)
         *  2. Frame path must be valid (security) */
        const isAutofillableOrigin = autofillableOrigins.has(frame.origin);

        if (isAutofillableOrigin && validateFramePath(frames, frameId, trustedOrigins)) {
            const crossOrigin = frame.origin !== frameOrigin;
            autofillableFrames.set(frameId, { frame, crossOrigin, tabId });
        }
    }

    autofillableOrigins.clear();
    return autofillableFrames;
};

type ParentFormQueryParams = {
    tabId: TabId;
    parentFrameID: FrameId;
    childFrameID: FrameId;
    childFrameAttributes: FrameAttributes;
};

export const getFrameParentFormId = (options: ParentFormQueryParams): Promise<MaybeNull<string>> =>
    sendTabMessage(
        backgroundMessage({
            type: WorkerMessageType.FRAME_QUERY,
            payload: {
                type: 'form',
                frameId: options.childFrameID,
                frameAttributes: options.childFrameAttributes,
            },
        }),
        { tabId: options.tabId, frameId: options.parentFrameID }
    )
        .then((res) => (res?.ok && res.type === 'form' ? res.formId : null))
        .catch(() => null);

export const isFrameContainedInParentForm = (parentFormID: string, options: ParentFormQueryParams): Promise<boolean> =>
    getFrameParentFormId(options)
        .then((formId) => formId === parentFormID)
        .catch(() => false);
