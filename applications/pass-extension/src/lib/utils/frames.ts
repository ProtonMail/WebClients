import type { WebNavigation } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull, TabId } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
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
export const validateFramePath = (frames: Frames, frameID: FrameID, allowedOrigins: string[]): boolean => {
    const path = getFramePath(frames, frameID);
    return path.every((pathFrameID) => {
        const frameOrigin = frames.get(pathFrameID)?.origin;
        if (!frameOrigin) return false;
        return allowedOrigins.includes(frameOrigin);
    });
};

type AutofillableFrame = { frameId: FrameID; crossOrigin: boolean };

/** Determines which frames are safe to autofill based on origin validation.
 * For same-origin requests (`frameID === 0`), only allows frames matching the
 * trigger origin. For cross-frame requests, additionally allows the top-level
 * origin to support legitimate embedded payment forms where the parent domain
 * needs autofill alongside the iframe. Validates complete frame ancestry to
 * prevent malicious intermediate frames from intercepting autofill data. */
export const getAutofillableFrameIDs = async (
    tabId: TabId,
    origin: string,
    originFrameID: FrameID
): Promise<AutofillableFrame[]> => {
    const frames = await getTabFrames(tabId, { parseOrigin: true });
    /** For non-main frames, determine top-level origin to allow parent domain
     * autofill for UX - handles cases where legitimate subframes need to autofill
     * on their parent domain (eg: payment forms with non-psp fields in the top-frame) */
    const crossOrigin = originFrameID !== 0 ? frames.get(0)?.origin : null;
    const allowedOrigins = [origin, crossOrigin].filter(truthy);
    const autofillableFrameIDs: AutofillableFrame[] = [];

    for (const [frameId, frame] of frames) {
        if (frame.origin && validateFramePath(frames, frameId, allowedOrigins)) {
            autofillableFrameIDs.push({
                frameId,
                crossOrigin: frame.origin !== origin,
            });
        }
    }

    return autofillableFrameIDs;
};
