/**
 * Routes in-app downloads to the native shells (Android WebView / iOS WKWebView).
 *
 * The web app owns the download buttons, but inside the native WebViews a normal browser download
 * of a `blob:` URL silently fails (Android `DownloadListener` / iOS `WKDownloadDelegate` never fire
 * for blob URLs). So when a native save bridge is present we hand the bytes to it instead of
 * triggering a browser download.
 *
 * Two bridges exist and are independent:
 *  - images: `saveImageViaNativeBridge`, present in every shipped shell.
 *  - any other file type (conversation exports, artifacts, PDF/PPTX, dev dumps):
 *    `saveFileViaNativeBridge`, Android only for now and only in newer app versions.
 * Images MUST keep going through the image bridge: older Android apps expose `saveBase64Image`
 * only, so routing an image to the file bridge would silently lose the save.
 *
 * The bridges are FEATURE-DETECTED (not user-agent sniffed) and the calls are fire-and-forget:
 * the native side ACKs by saving and shows its own success/failure UI.
 *
 * Contract (must match the native side exactly):
 *  - Android: `window.Android.saveBase64Image(base64, mimeType, suggestedName)`
 *  - Android: `window.Android.saveBase64File(base64, mimeType, suggestedName)`
 *  - iOS:     `window.webkit.messageHandlers.saveImage.postMessage({ base64, mimeType, name })`
 * In all cases `base64` is WITHOUT the `data:...;base64,` prefix. There is no iOS file handler yet.
 */

declare global {
    interface Window {
        Android?: {
            saveBase64Image?: (base64: string, mimeType: string, name: string) => void;
            saveBase64File?: (base64: string, mimeType: string, name: string) => void;
        };
        webkit?: {
            messageHandlers?: {
                saveImage?: {
                    postMessage: (message: { base64: string; mimeType: string; name: string }) => void;
                };
            };
        };
    }
}

/**
 * True when a native image-save bridge is actually wired up on `window`.
 *
 * Detection is deliberately strict:
 *  - Android: `window.Android.saveBase64Image` must be a function.
 *  - iOS: `saveImage` must be an OWN property of `webkit.messageHandlers` with a `postMessage`
 *    function. Inside a WKWebView `webkit.messageHandlers` is backed by a native object that
 *    reads truthy for handler names that were never registered — so a plain
 *    `webkit.messageHandlers.saveImage` truthiness check returns true even in a shell where the
 *    iOS handler doesn't exist. Requiring an own `postMessage` function avoids that false
 *    positive while staying pure feature detection (no user-agent sniffing).
 */
export const isNativeImageBridgeAvailable = (): boolean => {
    if (typeof window.Android?.saveBase64Image === 'function') {
        return true;
    }

    const messageHandlers = window.webkit?.messageHandlers;
    return (
        !!messageHandlers &&
        Object.prototype.hasOwnProperty.call(messageHandlers, 'saveImage') &&
        typeof messageHandlers.saveImage?.postMessage === 'function'
    );
};

/**
 * Reads a Blob as a base64 string with the `data:...;base64,` prefix stripped.
 * Done asynchronously via `FileReader` so large images don't block the UI.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // dataUrl looks like `data:<mime>;base64,<payload>` — take everything after the first comma.
            resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
};

/**
 * Shared dispatch for both bridges: read the Blob as prefix-free base64, then hand it to whichever
 * native bridge `tryBridge` recognises.
 *
 * @param defaultMimeType used when the Blob carries no type — the two bridges disagree on the
 *        sensible fallback (images vs. generic octet-stream).
 * @returns `true` when it dispatched to a native bridge, `false` when no bridge is present or the
 *          dispatch threw (caller should fall back to the normal browser download).
 */
const sendViaNativeBridge = async (
    blob: Blob,
    suggestedName: string,
    defaultMimeType: string,
    tryBridge: (base64: string, mimeType: string) => boolean
): Promise<boolean> => {
    const mimeType = blob.type || defaultMimeType;
    const base64 = await blobToBase64(blob);

    try {
        if (tryBridge(base64, mimeType)) {
            return true;
        }
    } catch (error) {
        console.error('Native Download: failed to dispatch to native bridge:', error);
    }

    return false;
};

/**
 * Hands an image Blob to the native image-save bridge (Android and iOS).
 *
 * @returns `true` when it dispatched to a native bridge (so the caller can skip the browser
 *          download), `false` when no bridge is present (caller should fall back to the normal
 *          browser download).
 */
export const saveImageViaNativeBridge = async (blob: Blob, suggestedName: string): Promise<boolean> => {
    if (!isNativeImageBridgeAvailable()) {
        return false;
    }

    return sendViaNativeBridge(blob, suggestedName, 'image/png', (base64, mimeType) => {
        if (typeof window.Android?.saveBase64Image === 'function') {
            window.Android.saveBase64Image(base64, mimeType, suggestedName);
            return true;
        }
        if (window.webkit?.messageHandlers?.saveImage) {
            window.webkit.messageHandlers.saveImage.postMessage({ base64, mimeType, name: suggestedName });
            return true;
        }
        return false;
    });
};

/**
 * True when the native bridge for non-image files is wired up on `window`.
 *
 * Strict feature detection, same rationale as `isNativeImageBridgeAvailable`. Android only: we do
 * NOT route files to the iOS `saveImage` handler, since that handler is image-specific and would
 * mis-handle e.g. a `.md` export. Older Android shells without `saveBase64File` report false and
 * keep their current behaviour.
 */
export const isNativeDownloadBridgeAvailable = (): boolean => typeof window.Android?.saveBase64File === 'function';

/**
 * Hands a non-image Blob (conversation export, artifact, PDF, PPTX, dev storage dump) to the
 * native file-save bridge.
 *
 * @returns `true` when it dispatched to a native bridge (so the caller can skip the browser
 *          download), `false` when no bridge is present (caller should fall back to the normal
 *          browser download).
 */
export const saveFileViaNativeBridge = async (blob: Blob, suggestedName: string): Promise<boolean> => {
    if (!isNativeDownloadBridgeAvailable()) {
        return false;
    }

    return sendViaNativeBridge(blob, suggestedName, 'application/octet-stream', (base64, mimeType) => {
        if (typeof window.Android?.saveBase64File === 'function') {
            window.Android.saveBase64File(base64, mimeType, suggestedName);
            return true;
        }
        return false;
    });
};
