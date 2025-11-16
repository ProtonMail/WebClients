import type { WebNavigation } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull, TabId } from '@proton/pass/types';
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

export type AutofillableFrame = { frameId: FrameID; crossOrigin: boolean };

/** Determines which frames are safe to autofill based on origin validation.
 * - Validates complete frame ancestry to prevent malicious intermediate frames
 * - Only autofills frames matching the trigger origin or top-level origin
 * - Rejects any frame with untrusted origins in its ancestry chain */
export const getAutofillableFrameIDs = async (
    tabId: TabId,
    frameOrigin: string,
    originFrameID: FrameID
): Promise<AutofillableFrame[]> => {
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

    const autofillableFrameIDs: AutofillableFrame[] = [];

    for (const [frameId, frame] of frames) {
        if (!frame.origin) continue;

        /** 1. Frame origin must be autofillable (policy)
         *  2. Frame path must be valid (security) */
        const isAutofillableOrigin = autofillableOrigins.has(frame.origin);

        if (isAutofillableOrigin && validateFramePath(frames, frameId, trustedOrigins)) {
            const crossOrigin = frame.origin !== frameOrigin;
            autofillableFrameIDs.push({ frameId, crossOrigin });
        }
    }

    autofillableOrigins.clear();

    return autofillableFrameIDs.sort((a, b) => {
        /** 1. Direct originFrameID match takes highest priority */
        if (a.frameId === originFrameID) return -1;
        if (b.frameId === originFrameID) return 1;

        /** 2. Same origin frames (non-cross-origin) come next */
        if (!a.crossOrigin && b.crossOrigin) return -1;
        if (a.crossOrigin && !b.crossOrigin) return 1;

        /** 3. Rest maintain their relative order */
        return 0;
    });
};
