/**
 * Converts a base64 data URL to a File object.
 */
export const base64ToFile = (dataUrl: string, filename: string, mimeType = 'image/png'): File => {
    const base64Data = dataUrl.split(',')[1];
    const bytes = atob(base64Data);
    const byteArray = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        byteArray[i] = bytes.charCodeAt(i);
    }
    return new File([byteArray], filename, { type: mimeType });
};
