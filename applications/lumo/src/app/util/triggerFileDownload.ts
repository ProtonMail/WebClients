import {
    isNativeDownloadBridgeAvailable,
    isNativeImageBridgeAvailable,
    saveFileViaNativeBridge,
    saveImageViaNativeBridge,
} from '../remote/lumoImageDownload';

type FileType = 'image' | 'other';

/**
 * Triggers a download for a `Blob` (its object URL is created and revoked here) or an already-resolved URL (e.g. from
 * `view.toImageURL()`), which the caller remains responsible for.
 */
export const triggerFileDownload = async (
    source: Blob | string,
    filename: string,
    type: FileType = 'other'
): Promise<void> => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const cleanup = () => {
        if (typeof source !== 'string') {
            setTimeout(() => URL.revokeObjectURL(url), 0);
        }
    };

    if (type === 'image' && isNativeImageBridgeAvailable()) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            if (await saveImageViaNativeBridge(blob, filename)) {
                cleanup();
                return; // Handled natively.
            }
        } catch (error) {
            console.error('Native Image Download: native save failed, falling back to browser download:', error);
        }
    }

    if (type === 'other' && isNativeDownloadBridgeAvailable()) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            if (await saveFileViaNativeBridge(blob, filename)) {
                cleanup();
                return; // Handled natively.
            }
        } catch (error) {
            console.error('Native Download: native save failed, falling back to browser download:', error);
        }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    cleanup();
};
