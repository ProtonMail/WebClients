import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull, TabId } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { resolveDomain } from '@proton/pass/utils/url/utils';

export type FrameID = number;
export type FrameData = { parent: MaybeNull<FrameID>; frameId: number };
export type Frames = Partial<Record<FrameID, FrameData>>;

/** Frame hierarchy tracker: Creates parent-child relationship map
 * for all frames in a tab. Used by `getFrameCoords` to walk up the
 * frame tree. Excludes orphaned frames (missing parents). */
export const getTabFrames = async (tabId: TabId): Promise<Frames> =>
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

export const getAutofillableFrameIDs = async (tabId: TabId, origin: string, frameID: FrameID): Promise<FrameID[]> => {
    /** security policy: Same-origin autofill only
     * Query all frames in the tab and filter to only those matching the
     * request's origin. This prevents cross-frame injection attacks where:
     * - Malicious iframes could receive credit card data
     * - XSS-injected frames could steal autofill information */
    const frames = (await browser.webNavigation.getAllFrames({ tabId })) ?? [];
    const allowedOrigins = [origin];

    if (frameID !== 0) {
        const tabOrigin = frames.find((frame) => frame.frameId === 0)?.url;
        if (tabOrigin) {
            const tabUrl = resolveDomain(parseUrl(tabOrigin));
            if (tabUrl) allowedOrigins.push(tabUrl);
        }
    }

    /** Send autofill data only to frames matching the trigger origin
     * Each frame will receive the same data and decide locally which
     * fields to fill based on their DOM content. */
    return frames
        .filter((frame) => allowedOrigins.includes(resolveDomain(parseUrl(frame.url)) ?? ''))
        .map(prop('frameId'));
};
