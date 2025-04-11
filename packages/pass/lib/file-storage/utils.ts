import {
    base64StringToUint8Array,
    blobToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToBlob,
} from '@proton/shared/lib/helpers/encoding';

export const blobToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blobToUint8Array(blob);
    return uint8ArrayToBase64String(buffer);
};

export const base64ToBlob = (b64: string): Blob => {
    const buffer = base64StringToUint8Array(b64);
    return uint8ArrayToBlob(buffer);
};

export const base64ToFile = (b64: string, filename: string, mimeType: string): File => {
    const blob = base64ToBlob(b64);
    return new File([blob], filename, { type: mimeType });
};
