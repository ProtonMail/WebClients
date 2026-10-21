import {
    isNativeDownloadBridgeAvailable,
    isNativeImageBridgeAvailable,
    saveFileViaNativeBridge,
    saveImageViaNativeBridge,
} from '../remote/lumoImageDownload';

type FileType = 'image' | 'other';

/** Resolve native download bytes without fetching Blobs or CSP-blocked base64 data URLs. */
const resolveDownloadBlob = async (source: Blob | string): Promise<Blob> => {
    if (typeof source !== 'string') {
        return source;
    }
    if (/^data:/i.test(source)) {
        const match = /^data:([^,]*);base64,([\s\S]*)$/i.exec(source);
        if (!match) {
            throw new Error('Unsupported download data URL');
        }
        const bytes = Uint8Array.from(atob(decodeURIComponent(match[2])), (character) => character.charCodeAt(0));
        return new Blob([bytes], { type: match[1] });
    }
    const response = await fetch(source);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
};

/**
 * Downloads a Blob or a caller-owned URL. Object URLs are only needed for browser downloads.
 * Native image failures reject so callers can show feedback: WebViews cannot save via the anchor fallback.
 */
export const triggerFileDownload = async (
    source: Blob | string,
    filename: string,
    type: FileType = 'other'
): Promise<void> => {
    if (type === 'image' && isNativeImageBridgeAvailable()) {
        const blob = await resolveDownloadBlob(source);
        if (!(await saveImageViaNativeBridge(blob, filename))) {
            throw new Error('Native image download failed');
        }
        return;
    }

    if (type === 'other' && isNativeDownloadBridgeAvailable()) {
        try {
            const blob = await resolveDownloadBlob(source);
            if (await saveFileViaNativeBridge(blob, filename)) {
                return;
            }
        } catch (error) {
            console.error('Native Download: native save failed, falling back to browser download:', error);
        }
    }

    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const link = document.createElement('a');
    try {
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
    } finally {
        link.remove();
        if (typeof source !== 'string') {
            setTimeout(() => URL.revokeObjectURL(url), 0);
        }
    }
};
