/**
 * Routes in-app image downloads to the native shells (Android WebView / iOS WKWebView).
 *
 * The web app owns the image download button, but inside the native WebViews a normal
 * browser download of a `blob:` URL silently fails (Android `DownloadListener` / iOS
 * `WKDownloadDelegate` never fire for blob URLs). So when a native save bridge is present we
 * hand the image bytes to it instead of triggering a browser download.
 *
 * The bridge is FEATURE-DETECTED (not user-agent sniffed) and the calls are fire-and-forget:
 * the native side ACKs by saving and shows its own success/failure UI.
 *
 * Contract (must match the native side exactly):
 *  - Android: `window.Android.saveBase64Image(base64, mimeType, suggestedName)`
 *  - iOS:     `window.webkit.messageHandlers.saveImage.postMessage({ base64, mimeType, name })`
 * In both cases `base64` is WITHOUT the `data:...;base64,` prefix.
 */

declare global {
    interface Window {
        Android?: {
            saveBase64Image?: (base64: string, mimeType: string, name: string) => void;
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
 * Hands an image Blob to the native save bridge.
 *
 * @returns `true` when it dispatched to a native bridge (so the caller can skip the browser
 *          download), `false` when no bridge is present (caller should fall back to the normal
 *          browser download).
 */
export const saveImageViaNativeBridge = async (blob: Blob, suggestedName: string): Promise<boolean> => {
    if (!isNativeImageBridgeAvailable()) {
        return false;
    }

    const mimeType = blob.type || 'image/png';
    const base64 = await blobToBase64(blob);

    try {
        if (typeof window.Android?.saveBase64Image === 'function') {
            window.Android.saveBase64Image(base64, mimeType, suggestedName);
            return true;
        }
        if (window.webkit?.messageHandlers?.saveImage) {
            window.webkit.messageHandlers.saveImage.postMessage({ base64, mimeType, name: suggestedName });
            return true;
        }
    } catch (error) {
        console.error('Native Image Download: failed to dispatch to native bridge:', error);
    }

    return false;
};

/**
 * Downloads an image, routing to the native save bridge inside the native shells and falling
 * back to a normal browser download (an `<a download>` click) everywhere else.
 *
 * The browser fallback also runs if no native bridge is present, if the bridge call fails to
 * dispatch, or if fetching the image bytes fails — so on the web this behaves exactly as it did
 * before the native bridge existed.
 *
 * @param imageUrl object URL / `blob:` URL / data URL of the image to save
 * @param fileName suggested file name for the saved image
 */
export const downloadImage = async (imageUrl: string, fileName: string): Promise<void> => {
    if (isNativeImageBridgeAvailable()) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            if (await saveImageViaNativeBridge(blob, fileName)) {
                return; // handled natively
            }
        } catch (error) {
            console.error('Native Image Download: native save failed, falling back to browser download:', error);
        }
    }

    // Normal browser download — unchanged from the original per-component implementation.
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
