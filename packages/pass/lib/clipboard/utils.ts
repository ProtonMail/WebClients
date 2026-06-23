/** Clipboard copy via textarea + execCommand('copy'). Unlike the async Clipboard
 * API, it doesn't require the `clipboard-write` permission, so it can succeed
 * from an iframe embedded in a website that doesn't allow that policy, provided
 * the document it runs in is focused and has a transient user activation. */
export const textareaCopy = (content: string): boolean => {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
};
