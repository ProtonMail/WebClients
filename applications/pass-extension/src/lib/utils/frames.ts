import { backgroundMessage, sendTabMessage } from 'proton-pass-extension/lib/message/send-message';
import type { FrameAttributes } from 'proton-pass-extension/types/frames';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { WebNavigation } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { FrameId, TabId } from '@proton/pass/types/worker/runtime';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { resolveDomain } from '@proton/pass/utils/url/utils';

export type FrameData = {
    parent: MaybeNull<FrameId>;
    frameId: number;
    origin: MaybeNull<string>;
    secure: MaybeNull<boolean>;
};

export type Frames = Map<FrameId, FrameData>;
export type FrameMapper<R> = (frame: WebNavigation.GetAllFramesCallbackDetailsItemType) => R;

/** Frame hierarchy tracker: Creates parent-child relationship map
 * for all frames in a tab. Used by `getFrameCoords` to walk up the
 * frame tree. Excludes orphaned frames (missing parents). */
export const getTabFrames = async (tabId: TabId, options?: { parseUrl: boolean }): Promise<Frames> =>
    browser.webNavigation.getAllFrames({ tabId }).then((frames) => {
        return (frames ?? []).reduce<Frames>((res, frame) => {
            const { parentFrameId, frameId, url } = frame;

            const parsedUrl = options?.parseUrl ? parseUrl(url) : null;
            const origin = parsedUrl ? resolveDomain(parsedUrl) : null;
            const secure = parsedUrl?.isSecure ?? null;

            /** Main frame (frameId 0) or orphaned frame */
            if (frameId === 0 || parentFrameId === -1) {
                res.set(frameId, { parent: null, frameId, origin, secure });
                return res;
            }

            const parent = res.get(parentFrameId);
            if (!parent) return res;

            res.set(frameId, { parent: parentFrameId, frameId, origin, secure });

            return res;
        }, new Map());
    });

/** Returns the path from target frame to root frame (leaf to root order) */
export const getFramePath = (frames: Frames, frameId: FrameId): FrameId[] => {
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
 * only allowed origins and secure protocols. Prevents cross-origin injection
 * attacks and protocol downgrade attacks by ensuring no malicious or insecure
 * intermediate frames in the ancestry chain. */
export const validateFramePath = (frames: Frames, frameID: FrameId, trustedOrigins: Set<string>): boolean => {
    const path = getFramePath(frames, frameID);
    return path.every((pathFrameID) => {
        const pathFrame = frames.get(pathFrameID);
        const origin = pathFrame?.origin;
        const secure = pathFrame?.secure;

        if (!(origin && secure)) return false;
        return trustedOrigins.has(origin);
    });
};

export type AutofillableFrame = { frame: FrameData; crossOrigin: boolean; tabId: TabId };
export type AutofillableFrames = Map<FrameId, AutofillableFrame>;

/** Determines which frames are safe to autofill based on origin validation.
 * - Validates complete frame ancestry to prevent malicious intermediate frames
 * - Only autofills frames matching the trigger origin or top-level origin
 * - Rejects any frame with untrusted origins in its ancestry chain */
export const getAutofillableFrames = async (
    tabId: TabId,
    sourceOrigin: string,
    sourceFrameID: FrameId
): Promise<AutofillableFrames> => {
    const frames = await getTabFrames(tabId, { parseUrl: true });
    const trustedOrigins = new Set<string>();
    const autofillableOrigins = new Set<string>();
    const autofillableFrames: AutofillableFrames = new Map();

    const topFrame = frames.get(0);
    const sourceFrame = frames.get(sourceFrameID);

    /** If unsecure cross-frame context : do not allow autofilling */
    const secureContext = Boolean(topFrame?.secure && sourceFrame?.secure);
    if (!secureContext) return autofillableFrames;

    /** Always trust and autofill the origin that triggered autofill */
    trustedOrigins.add(sourceOrigin);
    autofillableOrigins.add(sourceOrigin);

    /** Autofill policy: only trigger origin + top-level domain */
    if (sourceFrameID !== 0 && topFrame?.origin) autofillableOrigins.add(topFrame.origin);

    /** Build trusted ancestry chain by walking up to root frame */
    let current = sourceFrame;

    while (current && current.parent !== null) {
        const parent = frames.get(current.parent);
        if (!parent?.origin) break;
        trustedOrigins.add(parent.origin);
        current = parent;
    }

    /** Validate that the source frame path is secure */
    const securePath = sourceFrameID === 0 || validateFramePath(frames, sourceFrameID, trustedOrigins);
    if (!securePath) return autofillableFrames;

    for (const [frameId, frame] of frames) {
        /** 1. Frame must be secure */
        if (!(frame.origin && frame.secure)) continue;
        /** 2. Frame origin must be autofillable (policy) */
        if (!autofillableOrigins.has(frame.origin)) continue;
        /** 3. Frame path must be valid (security) */
        if (validateFramePath(frames, frameId, trustedOrigins)) {
            const crossOrigin = frame.origin !== sourceOrigin;
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

/** Iframes may get resized on focus if constrained
 * by a wrapper's element content-box with borders */
const IFRAME_SIZE_THRESHOLD = 4; /* px */

export const getFrameScore = (match: FrameAttributes, candidate: FrameAttributes): number => {
    let score = 0;
    const { width, height, src, name, title, ariaLabel } = match;

    /** direct attribute matches */
    if (src && candidate.src === src) score += 1.5;
    if (name && candidate.name === name) score++;
    if (title && candidate.title === title) score++;
    if (ariaLabel && candidate.ariaLabel === ariaLabel) score++;

    /** size match with threshold */
    if (width && Math.abs((candidate.width ?? 0) - width) < IFRAME_SIZE_THRESHOLD) score++;
    if (height && Math.abs((candidate.height ?? 0) - height) < IFRAME_SIZE_THRESHOLD) score++;

    /** cross-attribute scoring */
    if (name && (name === candidate.title || name === candidate.ariaLabel)) score += 0.5;
    if (title && (title === candidate.name || title === candidate.ariaLabel)) score += 0.5;
    if (ariaLabel && (ariaLabel === candidate.title || ariaLabel === candidate.name)) score += 0.5;

    return score;
};
