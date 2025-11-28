import { withContext } from 'proton-pass-extension/app/content/context/context';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { type FrameID, getFrameScore } from 'proton-pass-extension/lib/utils/frames';
import type { FrameAttributes } from 'proton-pass-extension/types/frames';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isVisible } from '@proton/pass/fathom';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { createWeakRefCache, maxAgeMemoize } from '@proton/pass/utils/fp/memo';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import identity from '@proton/utils/identity';

export const getFrameID = withContext<() => FrameID>((ctx) => {
    const frameId = ctx?.getExtensionContext()?.frameId;
    if (frameId === undefined) throw new Error('Unknown frameID');
    return frameId;
});

export const getFrameAttributesFromElement = (iframe: HTMLIFrameElement): FrameAttributes => {
    const src = iframe.getAttribute('src') ?? '';
    const name = iframe.getAttribute('name') ?? '';
    const title = iframe.getAttribute('title') ?? '';
    const ariaLabel = iframe.getAttribute('aria-label') ?? '';

    const parser = createStyleParser(iframe);
    const width = getComputedWidth(parser, 'inner').value;
    const height = getComputedHeight(parser, 'inner').value;

    return { src, name, title, ariaLabel, width, height };
};

export const getFrameAttributes = (): FrameAttributes => {
    const doc = document.documentElement;
    if (isMainFrame()) return {};

    return BUILD_TARGET !== 'chrome' && 'getFrameId' in browser.runtime
        ? {}
        : {
              src: location.href,
              name: window.name,
              width: doc.clientWidth,
              height: doc.clientHeight,
              ariaLabel: document.querySelector('[aria-label]')?.ariaLabel ?? undefined,
              title:
                  document.title ||
                  document.head.title ||
                  document.head.getAttribute('title') ||
                  document.head?.querySelector('title')?.textContent ||
                  (document.querySelector('[title]')?.getAttribute('title') ?? undefined),
          };
};

/** Determines if a frame's dimensions are too small to contain meaningful form elements.
 * Used as a fast pre-check to avoid expensive visibility calculations on tiny frames
 * that are typically used for tracking, analytics, or other non-interactive purposes */
export const isNegligableFrameRect = (width: number, height: number) => width < 40 || height < 15;

export const getFrameElement = (frameId: number, frameAttributes: FrameAttributes): Maybe<HTMLIFrameElement> => {
    const iframes = document.getElementsByTagName('iframe');

    /** Chromium browsers do not support the `getFrameId` API. Monitor
     * https://github.com/w3c/webextensions/issues/12 */
    if (BUILD_TARGET !== 'chrome' && 'getFrameId' in browser.runtime) {
        return ((): Maybe<HTMLIFrameElement> => {
            for (const iframe of iframes) {
                if (frameId === browser.runtime.getFrameId(iframe)) return iframe;
            }
        })();
    }

    /** Since we can't directly use the `frameId` on chromium, we need to
     * identify iframes by their attributes. We score each iframe based on
     * how well its properties match our signature. The iframe with the highest
     * matching score is selected. This approach handles cases where some
     * properties are missing or multiple iframes have similar attributes. */
    let bestCandidate: Maybe<HTMLIFrameElement>;
    let bestScore = -1;

    for (const iframe of iframes) {
        const score = getFrameScore(frameAttributes, getFrameAttributesFromElement(iframe));
        if (score > 0 && score > bestScore) {
            bestScore = score;
            bestCandidate = iframe;
        }
    }

    return bestCandidate;
};

/** Checks if the current frame is visible in the parent window by querying the service
 * worker. Uses async locking to prevent concurrent requests and brief memoization (1s)
 * to dedupe rapid successive calls (eg: during autofill sequence). */
export const getFrameParentVisibility = maxAgeMemoize(
    asyncLock(async (): Promise<boolean> => {
        try {
            return await sendMessage.on(
                contentScriptMessage({ type: WorkerMessageType.FRAME_VISIBILITY, payload: getFrameAttributes() }),
                (res) => res.type === 'success' && res.visible
            );
        } catch {
            return false;
        }
    }),
    { maxAge: 1_000 }
);

/** Used during frame hierarchy traversal when walking up from child to parent frames.
 * Brief memoization (1s) dedupes calls when multiple frames check the same iframe
 * during visibility detection sequences that work in conjunction with getFrameParentVisibility. */
export const getFrameVisibility = maxAgeMemoize(
    (frame: HTMLIFrameElement) => {
        const rect = frame.getBoundingClientRect();
        if (isNegligableFrameRect(rect.width, rect.height)) return false;
        return isVisible(frame, { opacity: false, skipCache: true });
    },
    { maxAge: 1_000, cache: createWeakRefCache(identity) }
);

/** Quick-checks if the current frame has a null origin and
 * is likely sandboxed without `allow-same-origin` */
export const isNullOriginFrame = (): boolean => {
    return String(globalThis.origin).toLowerCase() === 'null' || globalThis.location.hostname === '';
};

/** Checks if an iframe is sandboxed without both allow-scripts and
 * allow-same-origin. Requires the `HTMLIFrameElement` reference from
 * the parent frame to avoid cross-origin errors */
export const isSandboxedFrame = (frame: HTMLIFrameElement): boolean => {
    try {
        const sandbox = frame.getAttribute?.('sandbox');
        if (sandbox === null || sandbox === undefined) return false;
        if (sandbox === '') return true;

        const tokens = new Set(sandbox.toLowerCase().split(' '));
        return !['allow-scripts', 'allow-same-origin'].every((token) => tokens.has(token));
    } catch {
        return false;
    }
};
