/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.click();

    window.setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
    }, 0);
}

/** Trigger a browser download for raw bytes with the given MIME type. */
export function downloadBytes(bytes: ArrayBuffer, fileName: string, mimeType: string): void {
    downloadBlob(new Blob([bytes], { type: mimeType }), fileName);
}
