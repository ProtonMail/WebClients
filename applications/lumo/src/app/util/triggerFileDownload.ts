/**
 * Triggers a browser download for a `Blob` (its object URL is created and revoked here) or an
 * already-resolved URL (e.g. from `view.toImageURL()`), which the caller remains responsible for.
 */
export const triggerFileDownload = (source: Blob | string, filename: string): void => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (typeof source !== 'string') {
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
};
