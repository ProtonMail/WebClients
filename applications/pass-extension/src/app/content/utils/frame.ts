import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import type { FrameAttributes } from 'proton-pass-extension/types/frames';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isVisible } from '@proton/pass/fathom';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { createStyleParser, getComputedHeight, getComputedWidth } from '@proton/pass/utils/dom/computed-styles';
import { createWeakRefCache, maxAgeMemoize } from '@proton/pass/utils/fp/memo';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import identity from '@proton/utils/identity';

type FrameScore = [frame: HTMLIFrameElement, score: number];

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
    const candidates = Array.from(iframes).reduce<FrameScore[]>((acc, iframe) => {
        let score = 0;
        const { width, height, src, name, title } = frameAttributes;

        /** FIXME: this should support relative src's as well */
        const frameSrc = iframe.getAttribute('src');

        const parser = createStyleParser(iframe);
        const frameWidth = getComputedWidth(parser, 'inner').value;
        const frameHeight = getComputedHeight(parser, 'inner').value;

        if (src !== undefined && frameSrc === src) score++;
        if (name !== undefined && iframe.name === name) score++;
        if (title !== undefined && iframe.title === title) score++;
        if (width !== undefined && Math.abs(frameWidth - width) <= 1) score++;
        if (height !== undefined && Math.abs(frameHeight - height) <= 1) score++;

        acc.push([iframe, score]);
        return acc;
    }, []);

    return first(candidates.sort((a, b) => b[1] - a[1]))?.[0];
};

export const getFrameAttributes = (): FrameAttributes => {
    const doc = document.documentElement;

    return BUILD_TARGET !== 'chrome' && 'getFrameId' in browser.runtime
        ? {}
        : {
              src: location.href,
              name: window.name,
              width: doc.clientWidth,
              height: doc.clientHeight,
              title:
                  document.title ||
                  document.head.title ||
                  document.head.getAttribute('title') ||
                  document.head?.querySelector('title')?.textContent,
          };
};

/** Determines if a frame's dimensions are too small to contain meaningful form elements.
 * Used as a fast pre-check to avoid expensive visibility calculations on tiny frames
 * that are typically used for tracking, analytics, or other non-interactive purposes */
export const isNegligableFrameRect = (width: number, height: number) => width < 40 || height < 15;

/** Checks if the current frame is visible in the parent window by querying the service
 * worker. Uses async locking to prevent concurrent requests and brief memoization (1s)
 * to dedupe rapid successive calls (eg: during autofill sequence). */
export const getFrameParentVisibility = maxAgeMemoize(
    asyncLock(
        (): Promise<boolean> =>
            sendMessage.on(
                contentScriptMessage({ type: WorkerMessageType.FRAME_VISIBILITY, payload: getFrameAttributes() }),
                (res) => res.type === 'success' && res.visible
            )
    ),
    { maxAge: 1_000 }
);

/** Used during frame hierarchy traversal when walking up from child to parent frames.
 * Brief memoization (1s) dedupes calls when multiple frames check the same iframe
 * during visibility detection sequences that work in conjunction with getFrameParentVisibility. */
export const getFrameVisibility = maxAgeMemoize(
    (frame: HTMLIFrameElement) => {
        const rect = frame.getBoundingClientRect();
        if (isNegligableFrameRect(rect.width, rect.height)) return false;
        return isVisible(frame, { opacity: true, skipCache: true });
    },
    { maxAge: 1_000, cache: createWeakRefCache(identity) }
);

export const isSandboxedFrame = (): boolean => {
    if (String(globalThis.origin).toLowerCase() === 'null' || globalThis.location.hostname === '') return true;

    const sandbox = globalThis.frameElement?.getAttribute?.('sandbox');
    if (sandbox === null || sandbox === undefined) return false;
    if (sandbox === '') return true;

    const tokens = new Set(sandbox.toLowerCase().split(' '));
    return !['allow-scripts', 'allow-same-origin'].every((token) => tokens.has(token));
};
